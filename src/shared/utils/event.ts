export function e_preventDefault(e: Event) {
  if (e.preventDefault) {
    e.preventDefault();
  } else {
    e.returnValue = false;
  }
}
export function e_stopPropagation(e: Event) {
  if (e.stopPropagation) {
    e.stopPropagation();
  } else {
    e.cancelBubble = true;
  }
}
export function e_defaultPrevented(e: Event) {
  return e.defaultPrevented != null ? e.defaultPrevented : e.returnValue === false;
}
export function e_stop(e: Event) {
  e_preventDefault(e);
  e_stopPropagation(e);
}

export function e_target(e: Event) {
  return e.target || e.srcElement;
}
