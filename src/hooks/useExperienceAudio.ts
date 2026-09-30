import { useEffect, useRef } from 'react'
import { audio, type Track } from '../audio/audioManager'
import { useGuest } from '../state/guestStore'
import { useExperience, type ExperienceState } from '../state/experienceMachine'

/** Bài nào phát ở trạng thái nào — xem `trackFor` bên dưới. */
/** Các trạng thái SAU khi khách bắt đầu chạm vào thư/phong bì (nữ) hoặc thiệp/vé (nam) — từ đây mới đổi sang nhạc riêng của nhánh */
const AFTER_TAP = (s: ExperienceState) =>
  s === 'FEMALE_ENVELOPE_OPEN' || s === 'FEMALE_CARDS_READY' || s === 'FEMALE_TICKET_REVEAL' || s === 'FEMALE_TICKET_VIEW' ||
  s === 'FEMALE_SHUFFLE_TO_LETTER' || s === 'FEMALE_SHUFFLE_TO_TICKET' || s === 'FEMALE_LETTER_VIEW' || s === 'FEMALE_CARDS_STOW' ||
  s === 'TICKET_REVEAL' || s === 'TICKET_VIEW' || s === 'INVITATION_ENTER' || s === 'INVITATION_VIEW' || s === 'INVITATION_EXIT' || s === 'TICKET_STOW'

export type Cue = { track: Track | null; fade: number; level: number }

/**
 * Bài mở đầu ('ring') chạy XUYÊN từ màn cuộc gọi tới lúc khách chạm thư/vé:
 *   cuộc gọi → to · popup nhập thông tin → nhỏ lại · gửi xong (biến hình) → to lại · khách chạm thư/vé → bài riêng của nhánh vào.
 * Mọi lần đổi to/nhỏ hoặc đổi bài đều chậm (~3 giây): bài cũ bé dần, bài mới to dần.
 */
export const trackFor = (s: ExperienceState, gender: 'nam' | 'nu' | undefined, engaged: boolean): Cue => {
  switch (s) {
    case 'CALL_IDLE':
    case 'CALL_DRAGGING':
      return { track: 'ring', fade: 0.6, level: 1 }
    case 'RSVP_CLOSING': // huỷ popup → về cuộc gọi
      return { track: 'ring', fade: 2, level: 1 }
    case 'CALL_ANSWERED':
    case 'RSVP_OPEN':
      return { track: 'ring', fade: 3, level: 0.4 } // popup: nhỏ lại
    default:
      // RSVP_SUBMITTING và các cảnh nhánh trước khi khách chạm: bài mở đầu to lại
      if (!engaged) return { track: 'ring', fade: 3, level: 1 }
      return { track: gender === 'nu' ? 'female' : gender === 'nam' ? 'male' : null, fade: 3, level: 1 }
  }
}

const QA = new URLSearchParams(location.search).has('qa')

/** Gắn 1 lần ở App: nghe state machine → chọn bài. */
export function useExperienceAudio() {
  useEffect(() => {
    if (QA) (window as unknown as { __audio: unknown }).__audio = audio
    return audio.init()
  }, [])
  const state = useExperience((s) => s.state)
  const gender = useGuest((s) => s.guest?.gender)
  const engaged = useRef(false)
  useEffect(() => {
    // về cuộc gọi / popup → chưa chạm; đã chạm thì giữ (kể cả khi quay lại tập hồ sơ / cất vé)
    if (state === 'CALL_IDLE' || state === 'CALL_DRAGGING' || state === 'CALL_ANSWERED' || state.startsWith('RSVP_')) engaged.current = false
    else if (AFTER_TAP(state)) engaged.current = true
    const { track, fade, level } = trackFor(state, gender, engaged.current)
    audio.setScene(track, fade, level)
  }, [state, gender])
}
