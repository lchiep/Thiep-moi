import { useEffect, useRef } from 'react'
import { audio, type Track } from '../audio/audioManager'
import { useGuest } from '../state/guestStore'
import { useExperience, type ExperienceState } from '../state/experienceMachine'

/**
 * Bài nào phát ở trạng thái nào (Hiệp 29/09: hiện chỉ màn cuộc gọi + popup; 2 màn nhánh Nam/Nữ làm sau).
 *   cuộc gọi đến (chờ / đang vuốt) → chuông điện thoại
 *   nghe máy → popup (kể cả gửi lỗi / huỷ) → nhạc nền
 *   huỷ popup → quay lại chuông
 *   sang nhánh Nam / Nữ → nhạc popup chạy tiếp; khách chạm vào thư/vé lần đầu → nhạc riêng của nhánh vào (crossfade 2s)
 */
/** Các trạng thái SAU khi khách bắt đầu chạm vào thư/phong bì (nữ) hoặc thiệp/vé (nam) — từ đây mới đổi sang nhạc riêng của nhánh */
const AFTER_TAP = (s: ExperienceState) =>
  s === 'FEMALE_ENVELOPE_OPEN' || s === 'FEMALE_CARDS_READY' || s === 'FEMALE_TICKET_REVEAL' || s === 'FEMALE_TICKET_VIEW' ||
  s === 'FEMALE_SHUFFLE_TO_LETTER' || s === 'FEMALE_SHUFFLE_TO_TICKET' || s === 'FEMALE_LETTER_VIEW' || s === 'FEMALE_CARDS_STOW' ||
  s === 'TICKET_REVEAL' || s === 'TICKET_VIEW' || s === 'INVITATION_ENTER' || s === 'INVITATION_VIEW' || s === 'INVITATION_EXIT' || s === 'TICKET_STOW'

export const trackFor = (s: ExperienceState, gender: 'nam' | 'nu' | undefined, engaged: boolean): { track: Track | null; fade: number } => {
  switch (s) {
    case 'CALL_IDLE':
    case 'CALL_DRAGGING':
    case 'RSVP_CLOSING':
      return { track: 'ring', fade: 0.6 }
    case 'CALL_ANSWERED':
    case 'RSVP_OPEN':
    case 'RSVP_SUBMITTING':
      return { track: 'music', fade: 2.4 } // chuông nhỏ dần chậm, nhạc popup vào dần — không cắt cụt
    default:
      // popup biến hình → thư đóng phong bì → sang cảnh mới (nữ) / tập tài liệu mở (nam): VẪN nhạc popup chạy tiếp.
      // Khách chạm vào thư/phong bì/vé lần đầu → nhạc riêng của nhánh mới vào (crossfade), rồi giữ tới hết màn thiệp.
      if (!engaged) return { track: 'music', fade: 2.4 }
      return { track: gender === 'nu' ? 'female' : gender === 'nam' ? 'male' : null, fade: 2 }
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
    const { track, fade } = trackFor(state, gender, engaged.current)
    audio.setScene(track, fade)
  }, [state, gender])
}
