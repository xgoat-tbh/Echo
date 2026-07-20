import { Modal } from '../../design-system/components/Modal'
import { cn } from '../../lib/cn'
import type { VoiceDiagnostics } from '../../store/voiceStore'

interface VoiceDiagnosticsPanelProps {
  open: boolean
  onClose: () => void
  diagnostics: VoiceDiagnostics | null
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className="text-xs text-text-primary font-mono tabular-nums">
        {value}
      </span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-wider text-text-tertiary font-semibold mb-2">
        {title}
      </h3>
      <div className="rounded-lg border border-border bg-bg-tertiary/50 px-3 py-2">
        {children}
      </div>
    </div>
  )
}

export function VoiceDiagnosticsPanel({
  open,
  onClose,
  diagnostics,
}: VoiceDiagnosticsPanelProps) {
  if (!diagnostics) return null

  return (
    <Modal open={open} onClose={onClose} title="Voice Diagnostics" size="md">
      <div className="flex flex-col gap-4 mt-2">
        <Section title="Connection">
          <Row label="RTT" value={`${diagnostics.rtt} ms`} />
          <Row label="Jitter" value={`${diagnostics.jitter} ms`} />
          <Row label="Packet Loss" value={`${(diagnostics.packetLoss * 100).toFixed(1)}%`} />
          <Row label="Bitrate" value={`${(diagnostics.bitrate / 1000).toFixed(0)} kbps`} />
          <Row label="Codec" value={diagnostics.codec} />
          <Row label="FEC" value={diagnostics.fecActive ? 'Active' : 'Inactive'} />
        </Section>

        <Section title="Audio Input">
          <Row label="Device" value={diagnostics.inputDeviceName} />
          <Row label="Sample Rate" value={`${diagnostics.inputSampleRate} Hz`} />
          <Row label="Level" value={`${diagnostics.inputLevel.toFixed(1)} dBFS`} />
          <Row label="Noise Floor" value={`${diagnostics.noiseLevel.toFixed(1)} dBFS`} />
        </Section>

        <Section title="Audio Output">
          <Row label="Device" value={diagnostics.outputDeviceName} />
          <Row label="Latency" value={`${diagnostics.outputLatency} ms`} />
        </Section>

        <Section title="Network">
          <Row label="ICE Type" value={diagnostics.iceType} />
          <Row label="Local IP" value={diagnostics.localIp} />
        </Section>
      </div>
    </Modal>
  )
}
