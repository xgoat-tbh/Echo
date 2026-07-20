import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { overlayTransition, panelSlideUp } from '../../motion/presets'
import { DeviceSelector } from './DeviceSelector'
import { MicrophoneTest } from './MicrophoneTest'
import { Toggle } from '../../design-system/components/Toggle'
import { Button } from '../../design-system/components/Button'
import { useVoiceStore } from '../../store/voiceStore'

export function VoiceSetupOverlay() {
  const showSetup = useVoiceStore((s) => s.showSetup)
  const settings = useVoiceStore((s) => s.settings)
  const liveMicLevel = useVoiceStore((s) => s.liveMicLevel)
  const updateSettings = useVoiceStore((s) => s.updateSettings)
  const setShowSetup = useVoiceStore((s) => s.setShowSetup)

  const handleJoin = useCallback(() => {
    setShowSetup(false)
  }, [setShowSetup])

  return (
    <AnimatePresence>
      {showSetup && (
        <div className="fixed inset-0 z-overlay flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/60"
            {...overlayTransition}
            onClick={() => {}}
          />
          <motion.div
            className="relative w-full max-w-md rounded-xl border border-border/30 bg-bg-elevated/80 backdrop-blur-xl shadow-xl"
            {...panelSlideUp}
          >
            <div className="px-6 pt-6 pb-4">
              <h1 className="text-xl font-semibold text-text-primary">
                Microphone Setup
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Configure your audio before joining
              </p>
            </div>

            <div className="px-6 pb-2 space-y-5">
              <DeviceSelector
                label="Microphone"
                deviceKind="audioinput"
                selectedId={settings.inputDeviceId}
                onDeviceChange={(id) => updateSettings({ inputDeviceId: id })}
              />

              <DeviceSelector
                label="Speakers"
                deviceKind="audiooutput"
                selectedId={settings.outputDeviceId}
                onDeviceChange={(id) => updateSettings({ outputDeviceId: id })}
              />

              <MicrophoneTest
                liveLevel={liveMicLevel}
                onTestPlayback={() => {}}
                latency={null}
              />

              <div className="space-y-1">
                <Toggle
                  checked={settings.echoCancellation}
                  onChange={(checked) =>
                    updateSettings({ echoCancellation: checked })
                  }
                  label="Echo Cancellation"
                  description="Reduces echo from speakers"
                />
                <Toggle
                  checked={settings.noiseSuppression}
                  onChange={(checked) =>
                    updateSettings({ noiseSuppression: checked })
                  }
                  label="Noise Suppression"
                  description="Filters background noise"
                />
                <Toggle
                  checked={settings.pushToTalk}
                  onChange={(checked) =>
                    updateSettings({ pushToTalk: checked })
                  }
                  label={`Push to Talk (${settings.pushToTalkKey})`}
                  description="Hold to speak, release to mute"
                />
              </div>
            </div>

            <div className="px-6 pb-6 pt-4">
              <Button variant="primary" size="lg" fullWidth onClick={handleJoin}>
                Join Voice
              </Button>
              <p className="text-[11px] text-text-tertiary text-center mt-2">
                Microphone permission must be granted in your browser
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
