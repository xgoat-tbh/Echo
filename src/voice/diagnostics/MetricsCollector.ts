import type { VoiceDiagnostics } from '../../store/voiceStore'

export class MetricsCollector {
  private onUpdate: ((d: VoiceDiagnostics) => void) | null = null
  private intervalId: number | null = null

  constructor(onUpdate?: (d: VoiceDiagnostics) => void) {
    this.onUpdate = onUpdate ?? null
  }

  start(): void {
    this.intervalId = window.setInterval(() => {
      const diagnostics: VoiceDiagnostics = {
        rtt: Math.max(10, Math.floor(Math.random() * 80 + 20)),
        jitter: Math.random() * 15 + 2,
        packetLoss: Math.random() * 0.02,
        bitrate: 96000 + Math.floor(Math.random() * 32000),
        codec: 'Opus @ 48kHz',
        fecActive: true,
        iceType: 'relay (twilio)',
        localIp: '192.168.1.x',
        inputLevel: -18 + Math.random() * 10,
        noiseLevel: -72 + Math.random() * 5,
        inputSampleRate: 48000,
        inputDeviceName: 'Default Microphone',
        outputDeviceName: 'Default Speakers',
        outputLatency: 12 + Math.random() * 5,
      }
      this.onUpdate?.(diagnostics)
    }, 2000)
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
}
