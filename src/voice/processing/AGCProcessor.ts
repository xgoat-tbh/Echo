export class AGCProcessor {
  private targetLevel = 0.158
  private currentGain = 1.0
  private attackCoeff = 0.1
  private releaseCoeff = 0.02
  private enabled = true

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) this.currentGain = 1.0
  }

  process(input: Float32Array): Float32Array {
    if (!this.enabled) return input

    const output = new Float32Array(input.length)

    let sumSq = 0
    for (let i = 0; i < input.length; i++) {
      sumSq += input[i] * input[i]
    }
    const rms = Math.sqrt(sumSq / input.length)
    const level = Math.max(rms, 1e-10)

    const targetGain = this.targetLevel / level
    const coeff = targetGain > this.currentGain ? this.attackCoeff : this.releaseCoeff
    this.currentGain += (targetGain - this.currentGain) * coeff
    this.currentGain = Math.max(0.1, Math.min(10, this.currentGain))

    for (let i = 0; i < input.length; i++) {
      output[i] = input[i] * this.currentGain
    }

    return output
  }

  destroy(): void {
    this.currentGain = 1.0
  }
}
