import { useEffect } from 'react'
import { audio, type Track } from '../audio/audioManager'
import { useGuest } from '../state/guestStore'
import { useExperience, type ExperienceState } from '../state/experienceMachine'

/**
 * Bài nào phát ở trạng thái nào (Hiệp 29/09: hiện chỉ màn cuộc gọi + popup; 2 màn nhánh Nam/Nữ làm sau).
 *   cuộc gọi đến (chờ / đang vuốt) → chuông điện thoại
 *   nghe máy → popup (kể cả gửi lỗi / huỷ) → nhạc nền
 *   huỷ popup → quay lại chuông
 *   sang nhánh Nam / Nữ → nhạc popup nhỏ dần, nhạc riêng của nhánh to dần (2 giây), giữ tới hết màn thiệp
 */
export const trackFor = (s: ExperienceState, gender: 'nam' | 'nu' | undefined): { track: Track | null; fade: number } => {
  switch (s) {
    case 'CALL_IDLE':
    case 'CALL_DRAGGING':
    case 'RSVP_CLOSING':
      return { track: 'ring', fade: 0.6 }
    case 'CALL_ANSWERED':
    case 'RSVP_OPEN':
    case 'RSVP_SUBMITTING':
      return { track: 'music', fade: 1.2 }
    default:
      // nhánh Nam / Nữ: nhạc riêng, chạy suốt từ lúc popup biến hình tới hết màn thiệp (không ngắt khi đổi cảnh)
      if (s.startsWith('FEMALE_')) return { track: 'female', fade: 2 }
      if (s.startsWith('MALE_')) return { track: 'male', fade: 2 }
      return { track: gender === 'nu' ? 'female' : gender === 'nam' ? 'male' : null, fade: 2 } // TICKET_* / INVITATION_*
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
  useEffect(() => {
    const { track, fade } = trackFor(state, gender)
    audio.setScene(track, fade)
  }, [state, gender])
}
