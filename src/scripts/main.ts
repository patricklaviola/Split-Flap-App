import '@/styles/style.css'

import AudioManager from '@/scripts/classes/AudioManager'
import Board from '@/scripts/classes/Board'
import {
  calculateAdditionalRows,
  handleClick,
  handleKeyDown,
  handleMouseMove,
  handleWindowResize,
  initializeTasks,
  rawTasks,
} from '@/scripts/global'

import type { MousePosition } from '@/scripts/types'

let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D
export let board: Board
let resizeTimeout: NodeJS.Timeout | undefined
let mouseMoveThrottleTimeout: NodeJS.Timeout | undefined

const desiredCellWidth = 35 // 20-200 min-max
const framesPerSecond = 60

const audioManager = new AudioManager()
audioManager.load('mechanical-plastic-click.wav')

const charString = `!@#$%^&*()_-+={}[]:;'"<>,.?/0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ `
const chars = new Set()
for (const char of charString) {
  chars.add(char)
}

let prependedTasks: string[] = []

const mouse: MousePosition = {
  x: null,
  y: null,
}

export function createNewBoard(): Board {
  canvas.width = window.innerWidth
  const columns = Math.floor(canvas.width / desiredCellWidth)
  const cellWidth = canvas.width / columns
  const desiredCellHeight = cellWidth * 1.4
  const defaultRows = Math.floor(window.innerHeight / desiredCellHeight)
  const cellHeight = window.innerHeight / defaultRows
  const totalRows = defaultRows + calculateAdditionalRows(columns, defaultRows, prependedTasks) + 3
  canvas.height = totalRows * cellHeight
  const interval = 1000 / framesPerSecond
  board?.stopBoardAnimation()
  board?.stopFlapAnimation()
  board?.stopClockInterval()
  const newBoard = new Board(
    ctx,
    canvas.width,
    canvas.height,
    columns,
    totalRows,
    cellWidth,
    cellHeight,
    interval,
    charString,
    audioManager,
    prependedTasks,
    rawTasks,
  )
  newBoard.onRequestNewBoard = () => {
    board = createNewBoard()
  }
  newBoard.onTasksUpdated = (newTasks: string[]) => {
    prependedTasks = newTasks
  }
  return newBoard
}

export function handleOnLoad(): void {
  const canvasElement = document.getElementById('myCanvas') as HTMLCanvasElement
  const context = canvasElement.getContext('2d')
  if (!canvasElement || !context) {
    console.error('Canvas or context not found')
    return
  }
  canvas = canvasElement
  ctx = context
  prependedTasks = initializeTasks(rawTasks)
  board = createNewBoard()
  board.onRequestNewBoard = () => {
    board = createNewBoard()
  }
  board.onTasksUpdated = (newTasks: string[]) => {
    prependedTasks = newTasks
  }
}

export function setBoard(newBoard: Board) {
  board = newBoard
}

window.addEventListener('load', handleOnLoad)
window.addEventListener('resize', () => {
  handleWindowResize(resizeTimeout)
})
window.addEventListener('click', (e) => {
  handleClick(e, board, mouse)
})

window.addEventListener('keydown', (e) => {
  handleKeyDown(e, board, chars)
})
window.addEventListener('mousemove', (e) => {
  handleMouseMove(e, board, mouseMoveThrottleTimeout, mouse)
})

window.addEventListener(
  'click',
  () => {
    audioManager.unlock()
  },
  { once: true },
)

window.addEventListener(
  'touchstart',
  () => {
    audioManager.unlock()
  },
  { once: true },
)
window.addEventListener('dblclick', () => {
  audioManager.toggleSound()
})
