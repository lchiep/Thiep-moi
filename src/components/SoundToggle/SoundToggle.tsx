import { useSyncExternalStore } from 'react'
import { audio } from '../../audio/audioManager'
import { trackFor } from '../../hooks/useExperienceAudio'
import { useExperience } from '../../state/experienceMachine'
import './SoundToggle.css'

/** Nút bật/tắt tiếng nhỏ ở góc phải-trên. Chỉ hiện ở những màn đang có nhạc (màn cuộc gọi + popup). */
export default function SoundToggle() {
  const muted = useSyncExternalStore(audio.subscribe, audio.getMuted)
  const state = useExperience((s) => s.state)
  const show = trackFor(state).track !== null
  return (
    <button
      type="button"
      className={`snd ${show ? 'is-on' : ''} ${muted ? 'is-muted' : ''}`}
      aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
      aria-pressed={muted}
      tabIndex={show ? 0 : -1}
      onClick={() => audio.toggleMute()}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
        {muted ? <path d="M16 9.5l5 5M21 9.5l-5 5" /> : <path d="M16 9a4.2 4.2 0 0 1 0 6M18.6 6.6a7.8 7.8 0 0 1 0 10.8" />}
      </svg>
    </button>
  )
}
