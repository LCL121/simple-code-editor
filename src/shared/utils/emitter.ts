export type EventType = string | symbol;

export type Handler<T = unknown> = (event: T) => void;

export type EventHandlerList<T = unknown> = Array<Handler<T>>;

export type EventHandlerMap<Events extends Record<EventType, unknown>> = Map<
  keyof Events | '*',
  EventHandlerList<Events[keyof Events]>
>;

export interface Emitter<Events extends Record<EventType, unknown>> {
  on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void;

  off<Key extends keyof Events>(type: Key, handler?: Handler<Events[Key]>): void;

  emit<Key extends keyof Events>(type: Key, event: Events[Key]): void;
  emit<Key extends keyof Events>(type: undefined extends Events[Key] ? Key : never): void;
}

export function emitter<Events extends Record<EventType, unknown>>(
  all: EventHandlerMap<Events> = new Map()
): Emitter<Events> {
  type A = keyof Events;
  return {
    on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>) {
      const handlers: EventHandlerList<Events[Key]> | undefined = all.get(type);
      if (handlers) {
        handlers.push(handler);
      } else {
        all.set(type, [handler] as EventHandlerList<Events[keyof Events]>);
      }
    },
    off<Key extends keyof Events>(type: Key, handler?: Handler<Events[Key]>) {
      const handlers: EventHandlerList<Events[Key]> | undefined = all.get(type);
      if (handlers) {
        if (handler) {
          handlers.splice(handlers.indexOf(handler) >>> 0, 1);
        } else {
          all.set(type, []);
        }
      }
    },
    emit<Key extends keyof Events>(type: Key, event?: Events[Key]) {
      if (type === '*') {
        for (const [key, handlers] of all) {
          handlers.map((handler) => {
            handler(event!);
          });
        }
      } else {
        const handlers: EventHandlerList<Events[Key]> | undefined = all.get(type);
        if (handlers) {
          handlers.map((handler) => {
            handler(event!);
          });
        }
      }
    }
  };
}
