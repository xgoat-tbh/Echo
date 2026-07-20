import { useRef, useEffect } from 'react'

interface WaveformRendererProps {
  analyser: AnalyserNode | null
  width?: number
  height?: number
  color?: string
  isActive?: boolean
}

export function WaveformRenderer({
  analyser,
  width = 160,
  height = 32,
  color = 'hsla(220, 60%, 70%, 0.6)',
  isActive = true,
}: WaveformRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationIdRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !analyser || !isActive) return

    const ctx = canvas.getContext('2d')!
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationIdRef.current = requestAnimationFrame(draw)
      analyser.getByteTimeDomainData(dataArray)

      ctx.clearRect(0, 0, width, height)

      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.beginPath()

      const sliceWidth = width / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * height) / 2
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
        x += sliceWidth
      }

      ctx.stroke()
    }

    draw()

    return () => {
      cancelAnimationFrame(animationIdRef.current)
    }
  }, [analyser, width, height, color, isActive])

  if (!analyser || !isActive) {
    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width, height }}
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-sm"
      style={{ width, height }}
    />
  )
}
