import type { Guest } from '../state/guestStore'
import { specialGuest } from '../state/guestStore'

/**
 * Tờ giấy nhắn nhỏ hiện lên SAU KHI khách trả lời "Bạn sẽ đến chứ?" (chọn tham dự / sẽ thu xếp).
 * Nội dung theo TỪNG NHÓM khách:
 *  - nhóm chung (xưng anh/chị): bản `GENERAL`
 *  - nhóm luật riêng (vd. Hằng): tra theo `nameWord` trong `BY_SPECIAL`; `null` = nhóm đó không có tờ nhắn
 * Muốn thêm nhóm: thêm 1 dòng vào BY_SPECIAL với chữ nameWord của luật riêng (COPY.specialGuests).
 */
export type RsvpNote = { readonly paragraphs: readonly string[]; readonly button: string }

const GENERAL: RsvpNote = {
  paragraphs: [
    'Em có một đề xuất nhỏ với anh/chị là nếu anh/chị có dự định chuẩn bị hoa cho em thì anh/chị cứ để dành khoản đó cho những điều khác ý nghĩa hơn nhé ạ. ',
    'Em cũng không thích hoa lắm đâu ạ 😂. Với lại theo em thấy thì, một bó hoa chỉ xuất hiện trong khoảnh khắc ngắn rồi mang về không để làm gì thì hơi tiếc ạ.',
    'Với em, ngày hôm ấy anh/chị có thể dành chút thời gian đến chung vui cùng em hôm đó là món quà lớn nhất rồi ạ. 🤍',
  ],
  button: 'ĐÃ HIỂU',
}

/** Nhóm luật riêng. Hằng: chưa có bản riêng (xưng anh – bé nên không dùng bản chung) → null. */
const BY_SPECIAL: Record<string, RsvpNote | null> = {
  Hằng: null,
}

export function rsvpNoteFor(g: Pick<Guest, 'fullName'> | null | undefined): RsvpNote | null {
  const sp = g ? specialGuest(g.fullName) : undefined
  if (sp) return BY_SPECIAL[sp.nameWord] ?? null
  return GENERAL
}
