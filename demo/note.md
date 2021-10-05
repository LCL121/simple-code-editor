1. textarea 位置始终跟着光标走 => 保证composition input 位置正确性
2. undo 需将连续的、无选区的-delete/delete-/input以及compose 操作进行合并 // 可能和一般编辑器有区别
