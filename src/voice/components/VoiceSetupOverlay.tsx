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
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/75"
            {...overlayTransition}
            onClick={() => {}}
          />
          <motion.div
            className="relative w-full max-w-md rounded-2xl border border-border bg-bg-elevated/95 backdrop-blur-xl shadow-2xl overflow-hidden"
            {...panelSlideUp}
          >
            <div className="px-6 pt-6 pb-4 border-b border-border/40">
              <h1 className="text-base font-bold text-text-primary tracking-tight">
                Microphone Setup
              </h1>
              <p className="text-xs text-text-secondary mt-1">
                Configure your audio before joining the game voice channel
              </p>
            </div>

            <div className="px-6 py-5 space-y-5">
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

              <div className="space-y-1 bg-bg-secondary/40 border border-border/60 rounded-xl p-1">
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
                  description="Hold key to speak, release to mute"
                />
              </div>
            </div>

            <div className="px-6 pb-6 pt-2">
              <Button variant="primary" size="lg" fullWidth onClick={handleJoin} className="font-semibold shadow-xl">
                Join Voice Channel
              </Button>
              <p className="text-[10px] text-text-tertiary text-center mt-2.5 uppercase tracking-wide font-medium">
                Microphone permission must be granted in your browser
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
