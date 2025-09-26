export default class AudioManager {
  private audioCtx: AudioContext
  private buffer: AudioBuffer | null = null
  private enabled: boolean = true

  constructor() {
    // Safari still needs webkit prefix sometimes
    const AudioContextClass: typeof AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.audioCtx = new AudioContextClass()
  }

  async load(url: string): Promise<void> {
    const res = await fetch(url)
    const arrayBuffer = await res.arrayBuffer()
    this.buffer = await this.audioCtx.decodeAudioData(arrayBuffer)
  }

  unlock(): void {
    // Safari requires resuming AudioContext on a user gesture
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume()
    }
  }

  play(): void {
    if (!this.buffer || !this.enabled) return
    const source = this.audioCtx.createBufferSource()
    source.buffer = this.buffer
    source.connect(this.audioCtx.destination)
    source.start(0)
  }

  toggleSound(): void {
    this.enabled = !this.enabled
  }
}
