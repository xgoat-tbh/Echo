export class MuteController {
  private _isMuted = false
  private _pttEnabled = false
  private _pttHeld = false
  private _pttKey = 'Space'
  private onMuteChange: ((muted: boolean) => void) | null = null

  get isMuted(): boolean {
    return this._isMuted
  }

  get pttEnabled(): boolean {
    return this._pttEnabled
  }

  get outputGain(): number {
    if (this._pttEnabled && this._pttHeld) return 1.0
    if (this._pttEnabled && !this._pttHeld) return 0.0
    return this._isMuted ? 0.0 : 1.0
  }

  constructor(onMuteChange?: (muted: boolean) => void) {
    this.onMuteChange = onMuteChange ?? null
  }

  toggleMute(): void {
    this._isMuted = !this._isMuted
    this.onMuteChange?.(this._isMuted)
  }

  setMuted(muted: boolean): void {
    if (this._isMuted !== muted) {
      this._isMuted = muted
      this.onMuteChange?.(this._isMuted)
    }
  }

  setPTTEnabled(enabled: boolean): void {
    this._pttEnabled = enabled
    if (!enabled) {
      this._pttHeld = false
    }
  }

  setPTTKey(key: string): void {
    this._pttKey = key
  }

  get pttKey(): string {
    return this._pttKey
  }

  onPTTDown(): void {
    if (!this._pttEnabled) return
    this._pttHeld = true
  }

  onPTTUp(): void {
    if (!this._pttEnabled) return
    this._pttHeld = false
  }

  destroy(): void {
    this.onMuteChange = null
  }
}
