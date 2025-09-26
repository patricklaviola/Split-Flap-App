import '@/styles/style.css'

import {
  calculateAdditionalRows,
  handleClick,
  handleKeyDown,
  // handleDoubleClick,
  handleMouseMove,
  handleWindowResize,
  initializeTasks,
  prependNumsToTasks,
  rawTasks,
  unlockAudio,
} from '@/scripts/global'

let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D
let board: Board
let boardAnimation: number | undefined
let flapAnimation: number | undefined
let resizeTimeout: NodeJS.Timeout | undefined
let mouseMoveThrottleTimeout: NodeJS.Timeout | undefined
let clockIntervalId: number | undefined

const ua = navigator.userAgent
const isChrome = ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')
const isOpera = ua.includes('OPR') || ua.includes('Opera')
const isSupportedBrowser = isChrome || isOpera

const desiredCellWidth = 35 // 20-200 min-max
const framesPerSecond = 60
const colorPick = 'rgb(65, 65, 85)'
const color = colorPick.match(/\d+/g)?.join(', ') || ''
const taskNumColorPicker = 'rgb(102, 179, 212)'
const taskNumColor = taskNumColorPicker.match(/\d+/g)?.join(', ') || ''
const selectedFlapColorPicker = 'rgb(193, 210, 210)'
const selectedFlapColor = selectedFlapColorPicker.match(/\d+/g)?.join(', ') || ''
const editedTaskColorPicker = 'rgb(161, 184, 201)'
const editedTaskColor = editedTaskColorPicker.match(/\d+/g)?.join(', ') || ''
const sound = new Audio('mechanical-plastic-click.wav')
sound.volume = 0.99
sound.muted = false
const charString = `!@#$%^&*()_-+={}[]:;'"<>,.?/0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ `
const chars = new Set()
for (const char of charString) {
  chars.add(char)
}

let tasks: string[] = []

interface MousePosition {
  x: number | null
  y: number | null
}

const mouse: MousePosition = {
  x: null,
  y: null,
}

class Flap {
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

  constructor(
    index: number,
    ctx: CanvasRenderingContext2D,
    cellX: number,
    cellY: number,
    cellWidth: number,
    cellHeight: number,
    row: number,
    col: number,
    fontSize: number,
  ) {
    this.index = index
    this.ctx = ctx
    this.cellX = cellX
    this.cellY = cellY
    this.cellWidth = cellWidth
    this.cellHeight = cellHeight
    this.row = row
    this.col = col
    this.fontSize = fontSize
    this.targetChar = ''
    this.task = null
    this.taskStartIndex = null
    this.taskRowNum = null
    this.markedTaskNum = false
  }
  draw(char: string): void {
    const spaceBetween = this.cellWidth / 20

    // BACKGROUND
    this.ctx.fillStyle = 'rgb(0, 0, 0)'
    this.ctx.fillRect(this.cellX, this.cellY, this.cellWidth, this.cellHeight)

    // FLAPS
    const lineargradient = this.ctx.createLinearGradient(
      this.cellX + this.cellWidth * 0.5,
      this.cellY,
      this.cellX + this.cellWidth * 0.5,
      this.cellY + this.cellHeight,
    )
    let fillColor
    if (this.markedTaskNum) {
      fillColor = taskNumColor
    } else if (board.clickedFlapIndex === this.index) {
      fillColor = selectedFlapColor
    } else if (board.editedTask !== null && board.editedTask === this.task) {
      fillColor = editedTaskColor
    } else {
      fillColor = color
    }
    lineargradient.addColorStop(0, `rgba(${fillColor}, 0.45)`)
    lineargradient.addColorStop(0.5, `rgba(${fillColor}, 0.55)`)
    lineargradient.addColorStop(0.5, `rgba(${fillColor}, 0.65)`)
    lineargradient.addColorStop(1, `rgba(${fillColor}, 0.8)`)
    this.ctx.fillStyle = lineargradient
    this.drawRoundedRect(
      this.cellX + spaceBetween,
      this.cellY + spaceBetween,
      this.cellWidth - spaceBetween * 2,
      this.cellHeight - spaceBetween * 2,
      2,
    )

    // TEXT
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.58)'
    if (this.targetChar && this.targetChar !== ' ') {
      this.ctx.fillStyle = 'rgba(255, 179, 0, 0.84)'
    }
    this.ctx.font = `${this.fontSize}px monospace`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    const metrics = this.ctx.measureText(char)
    const actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
    this.ctx.fillText(
      char,
      this.cellX + this.cellWidth * 0.5,
      this.cellY +
        (this.cellHeight - actualHeight) * 0.5 +
        metrics.actualBoundingBoxAscent +
        this.cellHeight * 0.02,
    )

    // LINE BETWEEN FLAPS
    this.ctx.strokeStyle = 'rgb(0, 0, 0)'
    this.ctx.lineWidth = spaceBetween * 0.4
    this.ctx.beginPath()
    this.ctx.moveTo(this.cellX + spaceBetween, this.cellY + this.cellHeight / 2)
    this.ctx.lineTo(this.cellX + this.cellWidth - spaceBetween, this.cellY + this.cellHeight / 2)
    this.ctx.stroke()
  }

  drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath()
    this.ctx.moveTo(x + radius, y)
    this.ctx.lineTo(x + width - radius, y)
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    this.ctx.lineTo(x + width, y + height - radius)
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    this.ctx.lineTo(x + radius, y + height)
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    this.ctx.lineTo(x, y + radius)
    this.ctx.quadraticCurveTo(x, y, x + radius, y)
    this.ctx.closePath()
    this.ctx.fill()
  }
}

export class Board {
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
  toDoList: string[]
  clock: string
  date: string
  dateOnNewLine: boolean
  tasksStartingRow: number
  flaps: Flap[]
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

  constructor(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    columns: number,
    rows: number,
    cellWidth: number,
    cellHeight: number,
    interval: number,
    characters: string,
    sound: HTMLAudioElement,
    toDoList: string[],
  ) {
    this.ctx = ctx
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.columns = columns
    this.rows = rows
    this.cellWidth = cellWidth
    this.cellHeight = cellHeight
    this.interval = interval
    this.characters = characters
    this.sound = sound
    this.toDoList = toDoList
    this.clock = this.getTime()
    this.date = this.getDate()
    this.dateOnNewLine = this.clock.length + this.date.length > this.columns
    this.tasksStartingRow = !this.dateOnNewLine ? 2 : 3
    // this.tasksStartingFlap = this.tasksStartingRow * this.columns;
    this.flaps = []
    this.row = 0
    this.col = 0
    this.fontSize = this.cellWidth * 0.6
    this.charCount = 0
    this.lastTimeStamp = 0
    this.timer = this.interval
    this.soundCount = 0
    this.singlyAnimatedFlaps = new Map()
    this.singlyAnimatedFlapsToDelete = new Set()
    this.taskRowsMap = new Map()
    this.clickedFlapIndex = null
    this.editedTask = null
    this.hasStartedEditing = false
    this.initialize()
    this.assignTasksToFlaps()
    this.animateBoard(0)
  }

  initialize(): void {
    let flapIndex = 0
    for (let y = 0; y < this.cellHeight * this.rows; y += this.cellHeight) {
      this.col = 0
      for (let x = 0; x < this.canvasWidth - this.cellWidth * 0.5; x += this.cellWidth) {
        this.flaps.push(
          new Flap(
            flapIndex,
            this.ctx,
            x,
            y,
            this.cellWidth,
            this.cellHeight,
            this.row,
            this.col,
            this.fontSize,
          ),
        )
        this.col++
        flapIndex++
      }
      this.row++
    }
  }

  assignTasksToFlaps(): void {
    if (this.toDoList.length === 0) return

    let taskStartRow = this.tasksStartingRow

    this.toDoList.forEach((task: string, taskNumber: number) => {
      const taskStartIndex = taskStartRow * this.columns
      const indentedRows = Math.ceil(task.length / this.columns) - 1
      const indents = indentedRows > 0 ? indentedRows * 2 : 0
      const rowsNeeded = Math.ceil((task.length + indents) / this.columns)

      for (let r = 0; r < rowsNeeded; r++) {
        const currRow = taskStartRow + r
        const rowStartIndex = currRow * this.columns

        for (let c = 0; c < this.columns; c++) {
          const flapIndex = rowStartIndex + c
          if (flapIndex >= this.flaps.length) continue
          const flap = this.flaps[flapIndex]
          flap.taskRowNum = r
          flap.task = taskNumber
          flap.taskStartIndex = taskStartIndex
        }
      }
      taskStartRow += rowsNeeded
    })
  }

  getTime(): string {
    const date = new Date(Date.now())
    let hours = date.getHours()
    const minutes = date.getMinutes()
    const seconds = date.getSeconds()

    let pm = false
    if (hours > 12) {
      hours -= 12
      pm = true
    }
    const formattedHours = hours.toString()
    const formattedMinutes = minutes.toString().padStart(2, '0')
    const formattedSeconds = seconds.toString().padStart(2, '0')

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds} ${pm ? 'PM' : 'AM'}`
  }

  getDate(): string {
    const date = new Date(Date.now())
    const year = date.getFullYear() - 2000
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = date.getDay()

    const weekDays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

    return `${weekDays[weekday]} ${month}/${day}/${year}`
  }

  updateClock(): void {
    const newTime = this.getTime()
    let i = 0
    for (const digit of newTime) {
      if (digit !== this.flaps[i].targetChar) {
        // this.sound.currentTime = 0;
        // this.sound.play().catch(() => {});
        this.flaps[i].targetChar = digit
        this.flaps[i].draw(digit)
      }
      i++
    }
  }

  selectFlapOnClick(mouseX: number, mouseY: number): void {
    this.flaps.forEach((flap: Flap) => {
      if (
        mouseX > flap.cellX &&
        mouseX < flap.cellX + flap.cellWidth &&
        mouseY > flap.cellY &&
        mouseY < flap.cellY + flap.cellHeight
      ) {
        console.log(flap)
        if (this.editedTask !== null && flap.task !== this.editedTask) return

        if (flap.index === this.clickedFlapIndex) {
          this.clickedFlapIndex = null
          flap.draw(flap.targetChar)
          return
        }
        if (this.singlyAnimatedFlaps.has(flap.index)) {
          if (flap.targetChar) {
            flap.draw(flap.targetChar)
          } else {
            flap.draw('')
          }
          this.singlyAnimatedFlaps.delete(flap.index)
        }

        let prevClickedFlap
        if (this.clickedFlapIndex) {
          prevClickedFlap = this.flaps[this.clickedFlapIndex]
        }
        this.clickedFlapIndex = flap.index
        if (prevClickedFlap) {
          prevClickedFlap.draw(prevClickedFlap.targetChar)
        }
        flap.draw(flap.targetChar)
      }
    })
  }

  updateTasks(): void {
    if (this.editedTask === null) return

    let updatedTask = ''
    this.flaps.forEach((flap: Flap) => {
      if (flap.task === this.editedTask) {
        updatedTask += flap.targetChar
      }
    })
    const prefixToSlice = this.editedTask > 98 ? 3 : 2
    const slicedUpdatedTask = updatedTask.slice(prefixToSlice)

    if (this.editedTask > rawTasks.length - 1 && slicedUpdatedTask === '') {
      return
    } else if (this.editedTask <= rawTasks.length - 1 && slicedUpdatedTask === '') {
      rawTasks.splice(this.editedTask, 1)
    } else {
      rawTasks[this.editedTask] = slicedUpdatedTask
    }

    localStorage.setItem('tasks', JSON.stringify(rawTasks))

    tasks = prependNumsToTasks(rawTasks)
  }

  typeChar(char: string): void {
    if (this.clickedFlapIndex === null) return
    if (this.flaps[this.clickedFlapIndex].task === null) return

    if (this.editedTask !== null && !this.hasStartedEditing) {
      this.hasStartedEditing = true
    }
    const currentFlap = this.flaps[this.clickedFlapIndex]

    if (
      currentFlap.markedTaskNum ||
      (this.clickedFlapIndex + 1 < this.flaps.length &&
        this.flaps[this.clickedFlapIndex + 1].markedTaskNum)
    ) {
      return
    }

    if (this.editedTask === null) {
      this.editedTask = currentFlap.task
      this.hasStartedEditing = true
      this.flaps.forEach((flap: Flap, i: number) => {
        if (this.clickedFlapIndex !== null && i > this.clickedFlapIndex) {
          flap.targetChar = ''
          flap.task = this.editedTask
          flap.markedTaskNum = false
          flap.draw(flap.targetChar)
        }
      })
    }

    currentFlap.targetChar = char

    this.singlyAnimatedFlaps.set(currentFlap.index, 0)
    if (!flapAnimation && this.singlyAnimatedFlaps.size > 0) {
      this.animateFlaps(0)
    }

    if (this.clickedFlapIndex + 1 < this.flaps.length) {
      this.clickedFlapIndex += 1
    }
    const nextFlap = this.flaps[this.clickedFlapIndex]
    nextFlap.targetChar = ''
    nextFlap.draw(nextFlap.targetChar)
  }

  navigateWithKeys(key: string): void {
    if (
      (key === 'Backspace' || key === 'Escape' || key === 'Delete') &&
      (this.clickedFlapIndex === null ||
        this.editedTask === null ||
        this.hasStartedEditing === null)
    ) {
      return
    }

    if (this.editedTask !== null && key === 'Escape') return

    if (this.clickedFlapIndex === null && key !== 'Enter') {
      this.clickedFlapIndex = this.tasksStartingRow * this.columns + 2
      this.flaps[this.clickedFlapIndex].draw(this.flaps[this.clickedFlapIndex].targetChar)
      return
    }

    if (key === 'Enter' && this.hasStartedEditing) {
      this.updateTasks()
      initializeBoard()
    }

    if (
      key === 'Enter' &&
      this.editedTask === null &&
      (this.clickedFlapIndex === null || this.clickedFlapIndex + this.columns < this.flaps.length)
    ) {
      let prevFlap
      let nextFlap

      if (this.clickedFlapIndex === null) {
        this.clickedFlapIndex = this.tasksStartingRow * this.columns + 2
        nextFlap = this.flaps[this.clickedFlapIndex]
      } else if (this.flaps[this.clickedFlapIndex].task === null) {
        prevFlap = this.flaps[this.clickedFlapIndex]
        this.clickedFlapIndex = this.tasksStartingRow * this.columns + 2
        nextFlap = this.flaps[this.clickedFlapIndex]
      } else {
        const lastCellInRow = this.columns + this.flaps[this.clickedFlapIndex].row * this.columns
        let diff = lastCellInRow - this.clickedFlapIndex + 2

        while (
          this.flaps[this.clickedFlapIndex + diff].task === this.flaps[this.clickedFlapIndex].task
        ) {
          diff += this.columns
        }

        this.clickedFlapIndex += diff
        prevFlap = this.flaps[this.clickedFlapIndex - diff]
        nextFlap = this.flaps[this.clickedFlapIndex]
      }

      if (prevFlap) prevFlap.draw(prevFlap.targetChar)
      if (nextFlap) nextFlap.draw(nextFlap.targetChar)

      if (nextFlap && nextFlap.task === null) {
        const newTaskNum = prevFlap && prevFlap.task !== null ? prevFlap.task + 1 : 0

        this.editedTask = newTaskNum

        const newTaskNumStr = newTaskNum >= 9 ? `${newTaskNum + 1}` : `0${newTaskNum + 1}`

        for (let i = 0; i < newTaskNumStr.length; i++) {
          const index = this.clickedFlapIndex! - i - 1
          const charIndex = newTaskNumStr.length - i - 1

          this.flaps[index].targetChar = newTaskNumStr.charAt(charIndex)
          this.flaps[index].task = newTaskNum
          this.flaps[index].markedTaskNum = true
          this.flaps[index].draw(this.flaps[index].targetChar)
        }

        this.flaps.forEach((flap: Flap, i: number) => {
          if (this.clickedFlapIndex !== null && i >= this.clickedFlapIndex) {
            flap.targetChar = ''
            flap.task = newTaskNum
            flap.draw(flap.targetChar)
          }
        })
      }
    }

    if (
      (key === 'Backspace' || key === 'ArrowLeft') &&
      this.clickedFlapIndex !== null &&
      this.clickedFlapIndex > 0 &&
      !this.flaps[this.clickedFlapIndex - 1].markedTaskNum
    ) {
      if (key === 'Backspace') {
        this.flaps[this.clickedFlapIndex].targetChar = ''
      }
      this.clickedFlapIndex -= 1
      this.flaps[this.clickedFlapIndex + 1].draw(this.flaps[this.clickedFlapIndex + 1].targetChar)
      this.flaps[this.clickedFlapIndex].draw(this.flaps[this.clickedFlapIndex].targetChar)
    }

    if (
      (key === 'Backspace' || key === 'Delete') &&
      this.clickedFlapIndex !== null &&
      !this.flaps[this.clickedFlapIndex].markedTaskNum
    ) {
      this.editedTask = this.flaps[this.clickedFlapIndex].task
      this.flaps[this.clickedFlapIndex].targetChar = ''
      this.flaps[this.clickedFlapIndex].draw(this.flaps[this.clickedFlapIndex].targetChar)
    }

    if (
      key === 'ArrowRight' ||
      (key === 'Delete' &&
        this.clickedFlapIndex !== null &&
        this.clickedFlapIndex + 1 < this.flaps.length &&
        !this.flaps[this.clickedFlapIndex + 1].markedTaskNum)
    ) {
      if (key === 'Delete' && this.clickedFlapIndex !== null) {
        this.flaps[this.clickedFlapIndex + 1].targetChar = ''
      }
      if (this.clickedFlapIndex !== null) {
        this.clickedFlapIndex += 1
        this.flaps[this.clickedFlapIndex - 1].draw(this.flaps[this.clickedFlapIndex - 1].targetChar)
        this.flaps[this.clickedFlapIndex].draw(this.flaps[this.clickedFlapIndex].targetChar)
      }
    }

    if (
      key === 'ArrowDown' &&
      this.editedTask === null &&
      this.clickedFlapIndex !== null &&
      this.clickedFlapIndex + this.columns < this.flaps.length &&
      !this.flaps[this.clickedFlapIndex + this.columns].markedTaskNum
    ) {
      this.clickedFlapIndex += this.columns
      const prevFlap = this.flaps[this.clickedFlapIndex - this.columns]
      const currFlap = this.flaps[this.clickedFlapIndex]
      prevFlap.draw(prevFlap.targetChar)
      currFlap.draw(currFlap.targetChar)
    }

    if (
      key === 'ArrowUp' &&
      this.editedTask === null &&
      this.clickedFlapIndex !== null &&
      this.clickedFlapIndex - this.columns >= 0 &&
      !this.flaps[this.clickedFlapIndex - this.columns].markedTaskNum
    ) {
      this.clickedFlapIndex -= this.columns
      this.flaps[this.clickedFlapIndex + this.columns].draw(
        this.flaps[this.clickedFlapIndex + this.columns].targetChar,
      )
      this.flaps[this.clickedFlapIndex].draw(this.flaps[this.clickedFlapIndex].targetChar)
    }
    if (key === 'Escape') {
      const temp = this.clickedFlapIndex
      this.clickedFlapIndex = null
      if (temp !== null) {
        this.flaps[temp].draw(this.flaps[temp].targetChar)
      }
    }
  }

  selectFlapOnMouseMove(mouseX: number, mouseY: number): void {
    this.flaps.forEach((flap: Flap) => {
      if (
        !this.singlyAnimatedFlaps.has(flap.index) &&
        flap.index !== this.clickedFlapIndex &&
        mouseX > flap.cellX &&
        mouseX < flap.cellX + flap.cellWidth &&
        mouseY > flap.cellY &&
        mouseY < flap.cellY + flap.cellHeight
      ) {
        this.singlyAnimatedFlaps.set(flap.index, 0)
      }
    })
    if (!flapAnimation && this.singlyAnimatedFlaps.size > 0) {
      this.animateFlaps(0)
    }
  }

  animateFlaps(timeStamp: number): void {
    if (this.singlyAnimatedFlaps.size === 0) {
      flapAnimation = undefined
      this.soundCount = 0
      this.timer = 0
      this.lastTimeStamp = 0
      return
    }

    const deltaTime = timeStamp - this.lastTimeStamp
    this.lastTimeStamp = timeStamp

    if (this.timer > this.interval) {
      if (
        this.singlyAnimatedFlaps.size < 2 &&
        (this.soundCount % 8 === 0 || this.soundCount === 0)
      ) {
        this.sound.currentTime = 0
        this.sound.play().catch(() => {})
      } else if (
        this.singlyAnimatedFlaps.size >= 2 &&
        this.singlyAnimatedFlaps.size <= 8 &&
        (this.soundCount % 4 === 0 || this.soundCount === 0)
      ) {
        this.sound.currentTime = 0
        this.sound.play().catch(() => {})
      } else if (
        this.singlyAnimatedFlaps.size > 8 &&
        (this.soundCount % 1 === 0 || this.soundCount === 0)
      ) {
        this.sound.currentTime = 0
        this.sound.play().catch(() => {})
      }
      this.soundCount++

      this.singlyAnimatedFlaps.forEach((charCount, flapIndex) => {
        const currentChar = this.characters.charAt(charCount)
        if (this.flaps[flapIndex].targetChar === currentChar) {
          this.flaps[flapIndex].draw(currentChar)
          this.singlyAnimatedFlapsToDelete.add(flapIndex)
        } else if (charCount < this.characters.length) {
          this.flaps[flapIndex].draw(currentChar)
          this.singlyAnimatedFlaps.set(flapIndex, charCount + 1)
        } else {
          this.singlyAnimatedFlapsToDelete.add(flapIndex)
        }
      })

      if (this.singlyAnimatedFlapsToDelete.size > 0) {
        this.singlyAnimatedFlapsToDelete.forEach((flapToDelete) => {
          this.singlyAnimatedFlaps.delete(flapToDelete)
        })
      }
      this.singlyAnimatedFlapsToDelete.clear()
      this.timer = 0
      // console.log("animating flaps");
    } else {
      this.timer += deltaTime
    }
    flapAnimation = requestAnimationFrame(this.animateFlaps.bind(this))
  }

  animateBoard(timeStamp: number): void {
    const deltaTime = timeStamp - this.lastTimeStamp
    this.lastTimeStamp = timeStamp

    if (this.charCount < this.characters.length) {
      if (this.timer > this.interval) {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
        const currentChar = this.characters.charAt(this.charCount)

        this.flaps.forEach((flap, i) => {
          if (flap.targetChar) {
            flap.draw(flap.targetChar)
          } else if (i <= this.clock.length && currentChar === this.clock.charAt(i)) {
            flap.draw((flap.targetChar = currentChar))
          } else if (
            !this.dateOnNewLine &&
            i >= this.columns - this.date.length &&
            i <= this.columns &&
            currentChar === this.date.charAt(i - (this.columns - this.date.length))
          ) {
            flap.draw((flap.targetChar = currentChar))
          } else if (
            this.dateOnNewLine &&
            i > this.columns - 1 &&
            i <= this.columns - 1 + this.date.length &&
            i <= this.columns - 1 + this.columns &&
            currentChar === this.date.charAt(i - this.columns)
          ) {
            flap.draw((flap.targetChar = currentChar))
          } else if (
            // FIRST LINE OF TASK
            flap.task !== null &&
            flap.taskRowNum === 0
          ) {
            const task = this.toDoList[flap.task]
            const charIndex = flap.taskStartIndex !== null ? i - flap.taskStartIndex : 0
            if (
              flap.taskStartIndex !== null &&
              currentChar === task.charAt(charIndex) &&
              (flap.index === flap.taskStartIndex ||
                flap.index === flap.taskStartIndex + 1 ||
                (flap.task >= 99 && flap.index === flap.taskStartIndex + 2) ||
                (flap.task >= 999 && flap.index === flap.taskStartIndex + 3))
            ) {
              flap.markedTaskNum = true
            }
            if (flap.taskStartIndex !== null && currentChar === task.charAt(charIndex)) {
              flap.targetChar = currentChar
            }
            flap.draw(currentChar)
          } else if (
            // INDENTED TASK ROWS
            flap.task !== null &&
            flap.taskRowNum !== null &&
            flap.taskRowNum > 0 &&
            flap.taskStartIndex !== null &&
            i - flap.taskStartIndex - this.columns * flap.taskRowNum > 1
          ) {
            const task = this.toDoList[flap.task]
            const charIndex = i - flap.taskStartIndex - 2 * flap.taskRowNum
            if (currentChar === task.charAt(charIndex)) {
              flap.targetChar = currentChar
            }
            flap.draw(currentChar)
          } else {
            flap.draw(currentChar)
          }
        })

        this.sound.currentTime = 0
        this.sound.play().catch(() => {})
        this.soundCount++
        this.charCount++
        this.timer = 0
      } else {
        this.timer += deltaTime
      }
      boardAnimation = requestAnimationFrame(this.animateBoard.bind(this))
    } else {
      this.charCount = 0
      this.soundCount = 0
      this.timer = 0
      this.lastTimeStamp = 0
      boardAnimation = undefined
      this.updateClock()
      clockIntervalId = setInterval(() => {
        this.updateClock()
      }, 1000) as unknown as number
    }
  }
}

export function initializeBoard(): void {
  canvas.width = window.innerWidth
  const columns = Math.floor(canvas.width / desiredCellWidth)
  const cellWidth = canvas.width / columns
  const desiredCellHeight = cellWidth * 1.4
  const defaultRows = Math.floor(window.innerHeight / desiredCellHeight)
  const cellHeight = window.innerHeight / defaultRows
  const totalRows = defaultRows + calculateAdditionalRows(columns, defaultRows, tasks) + 3
  canvas.height = totalRows * cellHeight

  const interval = 1000 / framesPerSecond

  if (boardAnimation) {
    cancelAnimationFrame(boardAnimation)
    boardAnimation = undefined
  }
  if (flapAnimation) {
    cancelAnimationFrame(flapAnimation)
    flapAnimation = undefined
  }
  if (clockIntervalId) {
    clearInterval(clockIntervalId)
    clockIntervalId = undefined
  }

  board = new Board(
    ctx,
    canvas.width,
    canvas.height,
    columns,
    totalRows,
    cellWidth,
    cellHeight,
    interval,
    charString,
    sound,
    tasks,
  )
}

export function handleOnLoad(): void {
  if (!isSupportedBrowser) {
    alert(
      'Unsupported browser. Board initialization skipped. Supported browsers: Chrome (including Brave) and Opera.',
    )
    return
  }
  const canvasElement = document.getElementById('myCanvas') as HTMLCanvasElement
  const context = canvasElement.getContext('2d')
  if (!canvasElement || !context) {
    console.error('Canvas or context not found')
    return
  }
  canvas = canvasElement
  ctx = context
  tasks = initializeTasks(rawTasks)
  initializeBoard()
}

window.addEventListener('load', handleOnLoad)
window.addEventListener('resize', () => {
  handleWindowResize(resizeTimeout, isSupportedBrowser)
})
window.addEventListener('click', (e) => {
  handleClick(e, boardAnimation, board, mouse)
})

window.addEventListener('keydown', (e) => {
  handleKeyDown(e, boardAnimation, board, chars)
})
window.addEventListener('mousemove', (e) => {
  handleMouseMove(e, boardAnimation, board, mouseMoveThrottleTimeout, mouse)
})
window.addEventListener(
  'click',
  () => {
    unlockAudio(sound, board)
  },
  { once: true },
)
window.addEventListener(
  'touchstart',
  () => {
    unlockAudio(sound, board)
  },
  { once: true },
)
