export class ReconnectionManager {
  private attempt = 0
  private maxAttempts = 5
  private baseDelay = 1000
  private onAttempt: ((attempt: number, delay: number) => void) | null = null
  private onSuccess: (() => void) | null = null
  private onFailed: (() => void) | null = null
  private cancelled = false

  constructor(config?: {
    maxAttempts?: number
    baseDelay?: number
    onAttempt?: (attempt: number, delay: number) => void
    onSuccess?: () => void
    onFailed?: () => void
  }) {
    this.maxAttempts = config?.maxAttempts ?? 5
    this.baseDelay = config?.baseDelay ?? 1000
    this.onAttempt = config?.onAttempt ?? null
    this.onSuccess = config?.onSuccess ?? null
    this.onFailed = config?.onFailed ?? null
  }

  async execute(reconnectFn: () => Promise<void>): Promise<void> {
    this.attempt = 0
    this.cancelled = false

    while (this.attempt < this.maxAttempts && !this.cancelled) {
      try {
        this.attempt++
        const delay = Math.min(
          this.baseDelay * Math.pow(2, this.attempt - 1),
          30000
        )
        this.onAttempt?.(this.attempt, delay)

        await new Promise<void>((resolve) => setTimeout(resolve, delay))
        if (this.cancelled) return

        await reconnectFn()
        this.onSuccess?.()
        return
      } catch {
        // Continue to next attempt
      }
    }

    if (!this.cancelled) {
      this.onFailed?.()
    }
  }

  cancel(): void {
    this.cancelled = true
  }

  get currentAttempt(): number {
    return this.attempt
  }

  reset(): void {
    this.attempt = 0
    this.cancelled = false
  }
}
