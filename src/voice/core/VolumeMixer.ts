export class VolumeMixer {
  private ctx: AudioContext
  private gains = new Map<string, GainNode>()
  private sources = new Map<string, MediaStreamAudioSourceNode>()

  constructor(ctx: AudioContext) {
    this.ctx = ctx
  }

  addPlayer(playerId: string, stream: MediaStream, volume = 1): void {
    this.removePlayer(playerId)

    const source = this.ctx.createMediaStreamSource(stream)
    const gain = this.ctx.createGain()
    gain.gain.value = Math.max(0, Math.min(2, volume))

    source.connect(gain).connect(this.ctx.destination)

    this.sources.set(playerId, source)
    this.gains.set(playerId, gain)
  }

  setVolume(playerId: string, volume: number): void {
    const gain = this.gains.get(playerId)
    if (gain) {
      gain.gain.value = Math.max(0, Math.min(2, volume))
    }
  }

  removePlayer(playerId: string): void {
    const source = this.sources.get(playerId)
    const gain = this.gains.get(playerId)

    if (source) {
      source.disconnect()
      this.sources.delete(playerId)
    }
    if (gain) {
      gain.disconnect()
      this.gains.delete(playerId)
    }
  }

  destroy(): void {
    for (const id of this.sources.keys()) {
      this.removePlayer(id)
    }
  }
}
