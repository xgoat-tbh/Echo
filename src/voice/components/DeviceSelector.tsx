import { useState, useEffect } from 'react'
import { Select } from '../../design-system/components/Select'

interface DeviceSelectorProps {
  label: string
  deviceKind: 'audioinput' | 'audiooutput'
  selectedId: string | null
  onDeviceChange: (deviceId: string) => void
}

export function DeviceSelector({
  label,
  deviceKind,
  selectedId,
  onDeviceChange,
}: DeviceSelectorProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices()
        setDevices(allDevices.filter((d) => d.kind === deviceKind))
      } catch {
        setDevices([])
      }
    }

    load()
    navigator.mediaDevices.addEventListener('devicechange', load)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', load)
    }
  }, [deviceKind])

  const options = devices.map((d) => ({
    value: d.deviceId,
    label: d.label || `${label} (${d.deviceId.slice(0, 8)}...)`,
  }))

  return (
    <Select
      label={label}
      value={selectedId ?? ''}
      options={options}
      placeholder={devices.length === 0 ? 'No devices found' : 'Select device...'}
      onChange={onDeviceChange}
    />
  )
}
