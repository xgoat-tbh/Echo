export interface VADResult {
  isSpeaking: boolean
  level: number
  rms: number
  confidence: number
  timestamp: number
}

export class VADProcessor {
  private speakingThreshold = 0.3
  private silenceThreshold = 0.1
  private holdTimeMs = 200
  private debounceMs = 50
  private isSpeaking = false
  private holdTimer: number | null = null
  private lastSpeakingTime = 0
  private ctx: AudioContext | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private analyser: AnalyserNode | null = null
  private onVADResult: ((result: VADResult) => void) | null = null
  private animationId: number | null = null
  private running = false

  initialize(stream: MediaStream, onResult: (result: VADResult) => void): void {
    this.onVADResult = onResult
    this.ctx = new AudioContext({ sampleRate: 48000, latencyHint: 'interactive' })
    this.source = this.ctx.createMediaStreamSource(stream)
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 256
    this.source.connect(this.analyser)

    this.running = true
    this.poll()
  }

  private poll = (): void => {
    if (!this.running || !this.analyser) return

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteTimeDomainData(dataArray)

    let sumSq = 0
    for (let i = 0; i < dataArray.length; i++) {
      const val = (dataArray[i] - 128) / 128
      sumSq += val * val
    }
    const rms = Math.sqrt(sumSq / dataArray.length)
    const level = Math.min(1, rms * 3)

    const now = performance.now()
    const speakingNow = level > this.speakingThreshold

    if (speakingNow) {
      this.lastSpeakingTime = now
      if (!this.isSpeaking) {
        this.isSpeaking = true
        if (this.holdTimer !== null) {
          clearTimeout(this.holdTimer)
          this.holdTimer = null
        }
        this.emitResult(level, rms, true)
      } else {
        this.emitResult(level, rms, true)
      }
    } else if (this.isSpeaking) {
      if (now - this.lastSpeakingTime > this.holdTimeMs) {
        if (this.holdTimer === null) {
          this.holdTimer = window.setTimeout(() => {
            this.isSpeaking = false
            this.holdTimer = null
            this.emitResult(level, rms, false)
          }, this.holdTimeMs)
        }
      }
    }

    this.animationId = requestAnimationFrame(this.poll)
  }

  private emitResult(level: number, rms: number, isSpeaking: boolean): void {
    this.onVADResult?.({
      isSpeaking,
      level,
      rms,
      confidence: isSpeaking ? Math.min(1, level * 1.5) : 0,
      timestamp: this.ctx?.currentTime ?? 0,
    })
  }

  setThreshold(speaking: number, silence: number): void {
    this.speakingThreshold = speaking
    this.silenceThreshold = silence
  }

  destroy(): void {
    this.running = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
    }
    if (this.holdTimer !== null) {
      clearTimeout(this.holdTimer)
    }
    this.source?.disconnect()
    this.analyser?.disconnect()
    if (this.ctx?.state !== 'closed') {
      this.ctx?.close()
    }
    this.ctx = null
    this.source = null
    this.analyser = null
    this.onVADResult = null
  }
}
