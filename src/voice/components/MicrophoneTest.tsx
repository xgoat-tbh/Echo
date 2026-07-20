import { useState, useRef, useCallback } from 'react'
import { LevelMeter } from './LevelMeter'
import { Button } from '../../design-system/components/Button'

interface MicrophoneTestProps {
  liveLevel: number
  onTestPlayback: () => void
  latency: number | null
}

export function MicrophoneTest({
  liveLevel,
  onTestPlayback,
  latency,
}: MicrophoneTestProps) {
  const [recording, setRecording] = useState(false)
  const [playing, setPlaying] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const handleTest = useCallback(async () => {
    if (recording) return

    try {
      setRecording(true)
      chunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)

        audio.onplay = () => setPlaying(true)
        audio.onended = () => {
          setPlaying(false)
          URL.revokeObjectURL(url)
        }
        audio.onerror = () => setPlaying(false)

        audio.play()
        onTestPlayback()
      }

      recorder.start()
      setTimeout(() => recorder.stop(), 3000)
    } catch {
      setRecording(false)
    }
  }, [recording, onTestPlayback])

  return (
    <div className="rounded-xl border border-border bg-bg-secondary/40 p-4 space-y-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Microphone Test</span>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleTest}
          loading={recording}
          className="font-semibold text-xs"
        >
          {playing ? 'Playing...' : recording ? 'Recording...' : 'Test Microphone'}
        </Button>
      </div>

      <div className="bg-bg-tertiary/40 border border-border/60 rounded-lg p-2 flex items-center justify-center">
        <LevelMeter level={liveLevel} showLabel width={160} />
      </div>

      {latency !== null && (
        <div className="flex items-center gap-2 border-t border-border/40 pt-2 text-[11px]">
          <span className="text-text-secondary font-medium">Estimated Latency</span>
          <span className="text-text-primary font-mono font-bold">
            {latency} ms
          </span>
          <span
            className={`font-semibold uppercase tracking-wide text-[9px] ${
              latency < 30 ? 'text-success' : latency < 60 ? 'text-warning' : 'text-error'
            }`}
          >
            {latency < 30 ? 'Great' : latency < 60 ? 'OK' : 'Poor'}
          </span>
        </div>
      )}
    </div>
  )
}
