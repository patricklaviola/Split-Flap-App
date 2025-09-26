import { board } from '@/scripts/main'

export default class Flap {
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
  colorPicker: string
  color: string
  taskNumColorPicker: string
  taskNumColor: string
  selectedFlapColorPicker: string
  selectedFlapColor: string
  editedTaskColorPicker: string
  editedTaskColor: string

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
    this.colorPicker = 'rgb(65, 65, 85)'
    this.color = this.colorPicker.match(/\d+/g)?.join(', ') || ''
    this.taskNumColorPicker = 'rgb(102, 179, 212)'
    this.taskNumColor = this.taskNumColorPicker.match(/\d+/g)?.join(', ') || ''
    this.selectedFlapColorPicker = 'rgb(193, 210, 210)'
    this.selectedFlapColor = this.selectedFlapColorPicker.match(/\d+/g)?.join(', ') || ''
    this.editedTaskColorPicker = 'rgb(161, 184, 201)'
    this.editedTaskColor = this.editedTaskColorPicker.match(/\d+/g)?.join(', ') || ''
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
      fillColor = this.taskNumColor
    } else if (board.clickedFlapIndex === this.index) {
      fillColor = this.selectedFlapColor
    } else if (board.editedTask !== null && board.editedTask === this.task) {
      fillColor = this.editedTaskColor
    } else {
      fillColor = this.color
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
