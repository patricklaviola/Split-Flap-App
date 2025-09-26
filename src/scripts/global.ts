import { board, createNewBoard, setBoard } from '@/scripts/main'

import type Board from '@/scripts/classes/Board'
import type { MousePosition } from '@/scripts/types'

export const desktopInstructions = [
  '<strong>Enable sound:</strong> click or press any key',
  '<strong>Toggle sound on/off:</strong> double-click',
  "<strong>Create first task:</strong> press 'ENTER' and start typing",
  "<strong>Save/submit a task:</strong> when done typing press 'ENTER'",
  "<strong>Navigate across tasks:</strong> use 'ENTER', arrow keys, or left-click",
  "<strong>Adding an additional task:</strong> press 'ENTER' until you reach the end",
  "<strong>Edit an exiting task:</strong> start typing over a task, then press 'ENTER' when done",
  "<strong>Delete a task:</strong> start editing the task, then 'BACKSPACE' until the task is cleared, then press 'ENTER'",
]

export const touchDeviceRawTasks = [
  '<strong>Enable sound:</strong> tap anywhere on the screen',
  '<strong>Enable keyboard:</strong> double-tap anywhere on the screen',
  "<strong>Create first task:</strong> press 'ENTER' and start typing",
  "<strong>Save/submit a task:</strong> when done typing press 'ENTER'",
  "<strong>Navigate across tasks:</strong> use 'ENTER'",
  "<strong>Adding an additional task:</strong> press 'ENTER' until you reach the end",
  "<strong>Edit an exiting task:</strong> start typing over a task, then press 'ENTER' when done",
  "<strong>Delete a task:</strong> start editing the task, then 'BACKSPACE' until the task is cleared, then press 'ENTER'",
]

export function prependNumsToTasks(rawTasks: string[]): string[] {
  return rawTasks.map((task: string, i: number) => {
    let taskNum
    if (i + 1 > 9) {
      taskNum = `${i + 1}`
    } else {
      taskNum = `0${i + 1}`
    }
    return `${taskNum}${task}`
  })
}

function storageAvailable(storageType: string): boolean {
  try {
    const storage = window[storageType as keyof Window] as Storage
    const x = '__storage_test__'
    storage.setItem(x, x)
    storage.removeItem(x)
    return true
  } catch (e) {
    return (
      e instanceof DOMException &&
      (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      (window[storageType as keyof Window] as Storage)?.length !== 0
    )
  }
}

export function calculateAdditionalRows(
  cols: number,
  defaultRows: number,
  tasks: string[],
): number {
  const lineBreakFromDate = cols >= 29 ? 2 : 3
  const defaultTaskRows = defaultRows - lineBreakFromDate
  let totalTaskRows = 0

  tasks.forEach((task: string) => {
    if (task.length <= cols) {
      totalTaskRows += 1
    }

    if (task.length > cols) {
      const initialIndentedRows = Math.ceil(task.length / cols) - 1
      const initialLength = task.length + 2 * initialIndentedRows
      const totalIndentedRows = Math.ceil(initialLength / cols) - 1
      const diff = totalIndentedRows - initialIndentedRows
      const totalLength = initialLength + 2 * diff
      const totalRowsRequired = Math.ceil(totalLength / cols)
      totalTaskRows += totalRowsRequired
    }
  })

  const additionalRows = totalTaskRows - defaultTaskRows
  if (additionalRows > 0) {
    return additionalRows
  } else {
    return 0
  }
}

export function initializeTasks(rawTasks: string[]): string[] {
  if (!storageAvailable('localStorage')) {
    alert(
      'Local storage is not available, when closing the current window your changes will not be saved',
    )
    return prependNumsToTasks(rawTasks)
  }

  const savedTasks = localStorage.getItem('tasks')
  if (savedTasks) {
    rawTasks.length = 0
    rawTasks.push(...JSON.parse(savedTasks))
  }

  return prependNumsToTasks(rawTasks)
}

export function handleWindowResize(resizeTimeout: NodeJS.Timeout | undefined): void {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    board?.stopBoardAnimation()
    board?.stopFlapAnimation()
    board?.stopClockInterval()
    setBoard(createNewBoard())
  }, 500) as NodeJS.Timeout
}

export function handleClick(e: MouseEvent, board: Board, mouse: MousePosition): void {
  if (board?.boardAnimation) return
  mouse.x = e.clientX + window.scrollX
  mouse.y = e.clientY + window.scrollY
  board.selectFlapOnClick(mouse.x, mouse.y)
}

export function handleMouseMove(
  e: MouseEvent,
  board: Board,
  mouseMoveThrottleTimeout: NodeJS.Timeout | undefined,
  mouse: MousePosition,
): void {
  if (board?.boardAnimation) return
  if (!mouseMoveThrottleTimeout) {
    mouse.x = e.clientX + window.scrollX
    mouse.y = e.clientY + window.scrollY
    board.selectFlapOnMouseMove(mouse.x, mouse.y)
    mouseMoveThrottleTimeout = setTimeout(() => {
      mouseMoveThrottleTimeout = undefined
    }, 100) as NodeJS.Timeout
  }
}

export function handleKeyDown(e: KeyboardEvent, board: Board, chars: Set<unknown>): void {
  if (board?.boardAnimation) return
  if (
    e.key === ' ' ||
    e.key === 'Delete' ||
    e.key === 'ArrowLeft' ||
    e.key === 'ArrowRight' ||
    e.key === 'ArrowDown' ||
    e.key === 'ArrowUp'
  ) {
    e.preventDefault()
  }
  if (
    e.key === 'Backspace' ||
    e.key === 'Delete' ||
    e.key === 'Enter' ||
    e.key === 'ArrowLeft' ||
    e.key === 'ArrowRight' ||
    e.key === 'ArrowDown' ||
    e.key === 'ArrowUp' ||
    e.key === 'Escape'
  ) {
    board.navigateWithKeys(e.key)
    return
  }
  const key = e.key.toUpperCase()
  if (chars.has(key)) {
    board.typeChar(key)
  }
}
