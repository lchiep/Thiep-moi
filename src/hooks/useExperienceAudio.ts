import { useEffect } from 'react'
import { audio, type Track } from '../audio/audioManager'
import { useExperience, type ExperienceState } from '../state/experienceMachine'

/**
 * Bài nào phát ở trạng thái nào (Hiệp 29/09: hiện chỉ màn cuộc gọi + popup; 2 màn nhánh Nam/Nữ làm sau).
 *   cuộc gọi đến (chờ / đang vuốt) → chuông điện thoại
 *   nghe máy → popup (kể cả gửi lỗi / huỷ) → nhạc nền
 *   huỷ popup → quay lại chuông
 *   sang nhánh Nam / Nữ → nhạc nhỏ dần rồi tắt (chậm, ~3 giây) cho tới khi có nhạc riêng
 */
export const trackFor = (s: ExperienceState): { track: Track | null; fade: number } => {
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
      return { track: null, fade: 3 }
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
  useEffect(() => {
    const { track, fade } = trackFor(state)
    audio.setScene(track, fade)
  }, [state])
}
