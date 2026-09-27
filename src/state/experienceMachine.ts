import { create } from 'zustand'

/**
 * State machine của cả trải nghiệm.
 * Mỗi trạng thái chỉ nhận đúng sự kiện hợp lệ của nó — sự kiện khác bị bỏ qua
 * (chống chạm liên tục khi hiệu ứng đang chạy).
 */
export type ExperienceState =
  | 'CALL_IDLE'
  | 'CALL_DRAGGING'
  | 'CALL_ANSWERED'
  | 'RSVP_OPEN'
  | 'RSVP_CLOSING'
  | 'RSVP_SUBMITTING'
  | 'MALE_DOCUMENT_ENTER'
  | 'MALE_DOCUMENT_OPEN'
  | 'MALE_WAITING_TAP'
  | 'FEMALE_LETTER_TRANSFORM'
  | 'FEMALE_ENVELOPE_INSERT'
  | 'FEMALE_ENVELOPE_CLOSED'
  | 'FEMALE_SCENE_TRANSITION'
  | 'FEMALE_SCENE_READY'
  | 'FEMALE_WAITING_TAP'
  | 'FEMALE_ENVELOPE_OPEN'
  | 'FEMALE_CARDS_READY'
  | 'TICKET_REVEAL'
  | 'TICKET_VIEW'
  | 'INVITATION_ENTER'
  | 'INVITATION_VIEW'
  | 'INVITATION_EXIT'
  | 'TICKET_STOW'

export type ExperienceEvent =
  | 'DRAG_START'
  | 'DRAG_CANCEL'
  | 'ANSWER'
  | 'DONE'
  | 'CANCEL'
  | 'SUBMIT'
  | 'SUBMIT_FAIL'
  | 'GO_MALE'
  | 'GO_FEMALE'
  | 'TAP'
  | 'SWIPE'
  | 'BACK'
  | 'SWIPE_DOWN'
  | 'OPEN_CARD'

const TRANSITIONS: Partial<Record<ExperienceState, Partial<Record<ExperienceEvent, ExperienceState>>>> = {
  CALL_IDLE: { DRAG_START: 'CALL_DRAGGING' },
  CALL_DRAGGING: { DRAG_CANCEL: 'CALL_IDLE', ANSWER: 'CALL_ANSWERED' },
  CALL_ANSWERED: { DONE: 'RSVP_OPEN' },
  RSVP_OPEN: { CANCEL: 'RSVP_CLOSING', SUBMIT: 'RSVP_SUBMITTING' },
  RSVP_CLOSING: { DONE: 'CALL_IDLE' },
  RSVP_SUBMITTING: { SUBMIT_FAIL: 'RSVP_OPEN', GO_MALE: 'MALE_DOCUMENT_ENTER', GO_FEMALE: 'FEMALE_LETTER_TRANSFORM' },
  // nhánh Nam: popup → tập tài liệu trồi lên → mở bìa (vé nhô lên) → chờ chạm
  MALE_DOCUMENT_ENTER: { DONE: 'MALE_DOCUMENT_OPEN' },
  MALE_DOCUMENT_OPEN: { DONE: 'MALE_WAITING_TAP' },
  // chạm lần 1: rút vé ra khỏi túi (bất ngờ) · chạm lần 2: sang màn thiệp
  // chạm VÀO VÉ (trang phải) → rút vé · chạm VÀO THIỆP (trang trái) → camera zoom thẳng vào thiệp
  MALE_WAITING_TAP: { TAP: 'TICKET_REVEAL', OPEN_CARD: 'INVITATION_ENTER' },
  // nhánh Nữ: popup → lá thư → thư vào phong bì → phong bì đóng → cả cảnh trượt sang phải
  // → cảnh tulip (hoa, phong bì, KitKat, cánh hoa lần lượt yên vị) → chờ chạm vào thư
  FEMALE_LETTER_TRANSFORM: { DONE: 'FEMALE_ENVELOPE_INSERT' },
  FEMALE_ENVELOPE_INSERT: { DONE: 'FEMALE_ENVELOPE_CLOSED' },
  FEMALE_ENVELOPE_CLOSED: { DONE: 'FEMALE_SCENE_TRANSITION' },
  FEMALE_SCENE_TRANSITION: { DONE: 'FEMALE_SCENE_READY' },
  FEMALE_SCENE_READY: { DONE: 'FEMALE_WAITING_TAP' },
  // chạm thư: cánh hoa nâng phong bì lên TRƯỚC bó hoa → nắp mở → VÉ ra trước → thiệp ra sau
  FEMALE_WAITING_TAP: { TAP: 'FEMALE_ENVELOPE_OPEN' },
  FEMALE_ENVELOPE_OPEN: { DONE: 'FEMALE_CARDS_READY' },
  TICKET_REVEAL: { DONE: 'TICKET_VIEW' },
  // vuốt sang phải → trang thiệp đi vào từ bên trái
  // vuốt phải: cất vé vào túi → camera lia sang trái, zoom vào thiệp tới khi đầy màn hình
  // vuốt XUỐNG: cất vé lại vào túi, về tập hồ sơ đang mở (không sang thiệp)
  TICKET_VIEW: { SWIPE: 'INVITATION_ENTER', SWIPE_DOWN: 'TICKET_STOW' },
  TICKET_STOW: { DONE: 'MALE_WAITING_TAP' },
  INVITATION_ENTER: { DONE: 'INVITATION_VIEW' },
  // "← Quay lại": camera lùi ra khỏi thiệp về tập hồ sơ đang mở → lại chờ chạm rút vé
  INVITATION_VIEW: { BACK: 'INVITATION_EXIT' },
  INVITATION_EXIT: { DONE: 'MALE_WAITING_TAP' },
}

type Machine = {
  state: ExperienceState
  send: (event: ExperienceEvent) => boolean
}

export const useExperience = create<Machine>((set, get) => ({
  state: 'CALL_IDLE',
  send: (event) => {
    const next = TRANSITIONS[get().state]?.[event]
    if (!next) return false
    set({ state: next })
    return true
  },
}))

/** Dùng ngoài React (trong callback GSAP). */
export const sendExperience = (e: ExperienceEvent) => useExperience.getState().send(e)
