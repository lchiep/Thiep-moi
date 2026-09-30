import CallScene from '../scenes/CallScene/CallScene'
import DesignPreview from './DesignPreview'
import SoundGate from '../components/SoundGate/SoundGate'
import { useExperienceAudio } from '../hooks/useExperienceAudio'

/**
 * Phase 3: màn cuộc gọi.
 * Xem lại trang design system: thêm #design vào cuối địa chỉ.
 */
export default function App() {
  useExperienceAudio()
  if (window.location.hash === '#design') return <DesignPreview />
  return (
    <div className="app">
      <div className="app__phone">
        <CallScene />
        <SoundGate />
      </div>
    </div>
  )
}
