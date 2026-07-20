export class AudioPipeline {
  private ctx: AudioContext | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private inputGain: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private output: MediaStreamAudioDestinationNode | null = null
  private stream: MediaStream | null = null

  static constraints: MediaTrackConstraints = {
    echoCancellation: { ideal: true },
    noiseSuppression: { ideal: true },
    autoGainControl: { ideal: true },
    channelCount: { ideal: 1 },
    sampleRate: { ideal: 48000 },
    sampleSize: { ideal: 16 },
  }

  async initialize(deviceId?: string): Promise<MediaStream> {
    this.ctx = new AudioContext({
      sampleRate: 48000,
      latencyHint: 'interactive',
    })

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: deviceId
        ? { deviceId: { exact: deviceId }, ...AudioPipeline.constraints }
        : { ...AudioPipeline.constraints },
    })

    this.source = this.ctx.createMediaStreamSource(this.stream)
    this.inputGain = this.ctx.createGain()
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 256
    this.output = this.ctx.createMediaStreamDestination()

    this.source
      .connect(this.inputGain)
      .connect(this.analyser)
      .connect(this.output)

    return this.output.stream
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  getAudioContext(): AudioContext | null {
    return this.ctx
  }

  getInputStream(): MediaStream | null {
    return this.stream
  }

  getOutputTrack(): MediaStreamTrack | null {
    return this.output?.stream.getAudioTracks()[0] ?? null
  }

  setGain(value: number): void {
    if (this.inputGain) {
      this.inputGain.gain.value = Math.max(0, Math.min(1, value))
    }
  }

  async replaceTrack(newStream: MediaStream): Promise<void> {
    if (this.source) {
      this.source.disconnect()
    }

    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = newStream

    this.source = this.ctx!.createMediaStreamSource(newStream)
    this.source.connect(this.inputGain!)
  }

  destroy(): void {
    this.stream?.getTracks().forEach((t) => t.stop())
    this.source?.disconnect()
    this.inputGain?.disconnect()
    this.analyser?.disconnect()
    this.output?.disconnect()

    if (this.ctx?.state !== 'closed') {
      this.ctx?.close()
    }

    this.ctx = null
    this.source = null
    this.inputGain = null
    this.analyser = null
    this.output = null
    this.stream = null
  }
}
