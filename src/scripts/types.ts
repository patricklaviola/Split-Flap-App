export interface FlapType {
  index: number
  ctx: CanvasRenderingContext2D
  cellX: number
  cellY: number
  cellWidth: number
  cellHeight: number
  row: number
  col: number
  fontSize: number
  targetChar: string
  task: number | null
  taskStartIndex: number | null
  taskRowNum: number | null
  markedTaskNum: boolean

  draw(char: string): void
  drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): void
}

export interface BoardType {
  ctx: CanvasRenderingContext2D
  canvasWidth: number
  canvasHeight: number
  columns: number
  rows: number
  cellWidth: number
  cellHeight: number
  interval: number
  characters: string
  sound: HTMLAudioElement
  // toDoList: string[]
  tasks: string[]
  clock: string
  date: string
  dateOnNewLine: boolean
  tasksStartingRow: number
  flaps: FlapType[]
  row: number
  col: number
  fontSize: number
  charCount: number
  lastTimeStamp: number
  timer: number
  soundCount: number
  singlyAnimatedFlaps: Map<number, number>
  singlyAnimatedFlapsToDelete: Set<number>
  taskRowsMap: Map<number, number>
  clickedFlapIndex: number | null
  editedTask: number | null
  hasStartedEditing: boolean
  boardAnimation: number | undefined
  flapAnimation: number | undefined
  clockIntervalId: number | undefined

  initialize(): void
  prependNumsToTasks(): void
  assignTasksToFlaps(): void
  getTime(): string
  getDate(): string
  updateClock(): void
  selectFlapOnClick(mouseX: number, mouseY: number): void
  updateTasks(): void
  typeChar(char: string): void
  navigateWithKeys(key: string): void
  selectFlapOnMouseMove(mouseX: number, mouseY: number): void
  animateFlaps(timeStamp: number): void
  animateBoard(timeStamp: number): void
}
