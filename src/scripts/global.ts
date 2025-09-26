export const rawTasks = [
  'ANY CHANGES YOU MAKE TO YOUR TO-DO LIST WILL BE SAVED AUTOMATICALLY',
  'PRESS ANY KEY OR CLICK ANYWHERE IN THE WINDOW TO ENABLE SOUND',
  'PRESS ENTER TO MOVE TO THE NEXT TASK OR TO WRITE A NEW TASK',
  'START TYPING IN A TASK ROW TO ENABLE EDITING',
  "WHEN YOU'RE DONE TYPING THE TASK, PRESS ENTER TO SUBMIT AND SEE THE BOARD REFRESH",
  'TO DELETE A TASK, ENABLE EDITING BY TYPING ANY CHARACTER, THEN CLEAR THE TASK USING THE BACKSPACE KEY, THEN PRESS ENTER',
]

export function storageAvailable(type: string): boolean {
  let storage: Storage | undefined
  try {
    storage = (window as unknown as Record<string, Storage>)[type]
    const x = '__storage_test__'
    storage.setItem(x, x)
    storage.removeItem(x)
    return true
  } catch (e) {
    return (
      e instanceof DOMException &&
      e.name === 'QuotaExceededError' &&
      storage !== undefined &&
      storage.length !== 0
    )
  }
}
