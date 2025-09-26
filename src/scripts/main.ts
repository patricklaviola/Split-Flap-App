import '@/styles/style.css'

import AudioManager from '@/scripts/classes/AudioManager'
import Board from '@/scripts/classes/Board'
import {
  calculateAdditionalRows,
  desktopInstructions,
  handleClick,
  handleKeyDown,
  handleMouseMove,
  handleWindowResize,
  initializeTasks,
  touchDeviceRawTasks,
} from '@/scripts/global'

import type { MousePosition } from '@/scripts/types'

const isTouchDevice = window.matchMedia('(pointer: coarse) or (hover: none)').matches
const mql = window.matchMedia('(orientation: landscape)')

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

const rawTasks: string[] = []
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

function handleOnLoad(): void {
  const modal = document.getElementById('instructions-modal') as HTMLElement
  const closeBtn = document.getElementById('close-modal') as HTMLButtonElement
  const instructionsContainer = document.getElementById('instructions-list') as HTMLElement

  const instructions = isTouchDevice ? touchDeviceRawTasks : desktopInstructions
  instructionsContainer.innerHTML = `
    <ul>
      ${instructions.map((item) => `<li>${item}</li>`).join('')}
    </ul>
  `

  // if (!localStorage.getItem('visited')) {
  //   modal.classList.remove('hidden')
  // }

  closeBtn.onclick = () => {
    modal.classList.add('hidden')
  }

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

if (!isTouchDevice) {
  window.addEventListener(
    'click',
    () => {
      audioManager.unlock()
    },
    { once: true },
  )
  window.addEventListener('click', (e) => {
    handleClick(e, board, mouse)
  })
  window.addEventListener('keydown', (e) => {
    handleKeyDown(e, board, chars)
  })
  window.addEventListener('dblclick', () => {
    audioManager.toggleSound()
  })
  window.addEventListener('mousemove', (e) => {
    handleMouseMove(e, board, mouseMoveThrottleTimeout, mouse)
  })
  window.addEventListener('resize', () => {
    handleWindowResize(resizeTimeout)
  })
}

if (isTouchDevice) {
  mql.addEventListener('change', () => {
    handleWindowResize(resizeTimeout)
  })

  window.addEventListener(
    'touchstart',
    () => {
      audioManager.unlock()
    },
    { once: true },
  )

  const hiddenInput = document.createElement('input')
  hiddenInput.type = 'text'
  hiddenInput.id = 'hidden-input'
  hiddenInput.name = 'hidden-input'
  hiddenInput.style.position = 'absolute'
  hiddenInput.style.opacity = '0'
  hiddenInput.style.height = '0'
  hiddenInput.style.width = '0'
  hiddenInput.style.border = 'none'
  hiddenInput.style.outline = 'none'
  hiddenInput.style.position = 'fixed'
  hiddenInput.style.top = '0'
  hiddenInput.style.left = '0'
  document.body.appendChild(hiddenInput)

  hiddenInput.addEventListener('keydown', (e) => {
    handleKeyDown(e, board, chars)
  })

  let lastTap = 0
  window.addEventListener('touchend', (e) => {
    const now = Date.now()
    const timeSince = now - lastTap
    if (timeSince > 0 && timeSince < 300) {
      e.preventDefault()
      hiddenInput.focus()
    }
    lastTap = now
  })
}
