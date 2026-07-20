export class DeviceManager {
  private audioElement: HTMLAudioElement | null = null

  setAudioElement(el: HTMLAudioElement): void {
    this.audioElement = el
  }

  async enumerateInputs(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter((d) => d.kind === 'audioinput')
  }

  async enumerateOutputs(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter((d) => d.kind === 'audiooutput')
  }

  async switchOutput(deviceId: string): Promise<void> {
    if (this.audioElement && typeof (this.audioElement as any).setSinkId === 'function') {
      try {
        await (this.audioElement as any).setSinkId(deviceId)
      } catch {
        // Fallback: can't switch output on this browser
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      return true
    } catch {
      return false
    }
  }

  static async isPermissionGranted(): Promise<PermissionState> {
    try {
      const result = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      })
      return result.state
    } catch {
      return 'prompt'
    }
  }
}
