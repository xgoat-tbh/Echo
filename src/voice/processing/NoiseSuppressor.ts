export class NoiseSuppressor {
  private enabled = true

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  process(input: Float32Array): Float32Array {
    if (!this.enabled) return input
    return input
  }

  destroy(): void {
    // Cleanup RNNoise WASM if loaded
  }
}
