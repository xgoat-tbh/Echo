import { Modal } from '../../design-system/components/Modal'
import type { VoiceDiagnostics } from '../../store/voiceStore'

interface VoiceDiagnosticsPanelProps {
  open: boolean
  onClose: () => void
  diagnostics: VoiceDiagnostics | null
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <span className="text-xs text-text-secondary font-medium">{label}</span>
      <span className="text-xs text-text-primary font-mono tabular-nums">
        {value}
      </span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary font-bold mb-2 pl-1">
        {title}
      </h3>
      <div className="rounded-xl border border-border/80 bg-bg-secondary/30 px-4 py-1 select-text">
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
      <div className="flex flex-col gap-4 mt-2 max-h-[60vh] overflow-y-auto pr-1">
        <Section title="Connection Performance">
          <Row label="RTT (Round Trip Time)" value={`${diagnostics.rtt} ms`} />
          <Row label="Jitter" value={`${diagnostics.jitter} ms`} />
          <Row label="Packet Loss" value={`${(diagnostics.packetLoss * 100).toFixed(2)}%`} />
          <Row label="Bitrate" value={`${(diagnostics.bitrate / 1000).toFixed(1)} kbps`} />
          <Row label="Codec / Audio Profile" value={diagnostics.codec} />
          <Row label="FEC (Forward Error Correction)" value={diagnostics.fecActive ? 'Active' : 'Inactive'} />
        </Section>

        <Section title="Audio Hardware Input">
          <Row label="Selected Input Device" value={diagnostics.inputDeviceName || 'Default Microphone'} />
          <Row label="Sample Rate" value={`${diagnostics.inputSampleRate} Hz`} />
          <Row label="Active Level" value={`${diagnostics.inputLevel.toFixed(1)} dBFS`} />
          <Row label="Ambient Noise Floor" value={`${diagnostics.noiseLevel.toFixed(1)} dBFS`} />
        </Section>

        <Section title="Audio Hardware Output">
          <Row label="Selected Output Device" value={diagnostics.outputDeviceName || 'Default Speakers'} />
          <Row label="Output Latency" value={`${diagnostics.outputLatency} ms`} />
        </Section>

        <Section title="Network Routing">
          <Row label="ICE Candidate Type" value={diagnostics.iceType} />
          <Row label="Local Endpoint IP" value={diagnostics.localIp} />
        </Section>
      </div>
    </Modal>
  )
}
