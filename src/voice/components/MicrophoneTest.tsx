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
    <div className="rounded-lg border border-border bg-bg-tertiary/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">Microphone Test</span>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleTest}
          loading={recording}
        >
          {playing ? 'Playing...' : recording ? 'Recording...' : 'Test Microphone'}
        </Button>
      </div>

      <LevelMeter level={liveLevel} showLabel />

      {latency !== null && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">Estimated latency</span>
          <span className="text-xs text-text-primary font-mono tabular-nums">
            {latency} ms
          </span>
          <span
            className={`text-xs ${
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
