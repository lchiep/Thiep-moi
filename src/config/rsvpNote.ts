import type { Guest } from '../state/guestStore'
import { specialGuest } from '../state/guestStore'

/**
 * Tờ giấy nhắn nhỏ hiện lên SAU KHI khách trả lời "Bạn sẽ đến chứ?" (chọn tham dự / sẽ thu xếp).
 * Nội dung theo TỪNG NHÓM khách:
 *  - nhóm chung (xưng {p}): bản `GENERAL`
 *  - nhóm luật riêng (vd. Hằng): tra theo `nameWord` trong `BY_SPECIAL`; `null` = nhóm đó không có tờ nhắn
 * Muốn thêm nhóm: thêm 1 dòng vào BY_SPECIAL với chữ nameWord của luật riêng (COPY.specialGuests).
 */
export type RsvpNote = { readonly paragraphs: readonly string[]; readonly button: string }

const GENERAL: RsvpNote = {
  paragraphs: [
    'Em có một đề xuất nhỏ với {p} ạ. À mà em bật mí trước với {p} một chút là em không thích hoa lắm đâu ạ 😂',
    'Nên nếu {p} có dự định chuẩn bị hoa cho em thì {p} cứ để dành khoản đó cho những điều khác ý nghĩa hơn nhé ạ. Vì với em, một bó hoa chỉ xuất hiện trong khoảnh khắc ngắn rồi lại phải mang về thì hơi tiếc.',
    'Thật ra trong ngày hôm ấy, điều em trân trọng nhất vẫn là sự có mặt và những lời chúc của {p}. Chỉ cần {p} có thể sắp xếp thời gian đến chung vui cùng em là em đã vui và cảm thấy rất đủ đầy rồi ạ. 🤍',
  ],
  button: 'ĐÃ HIỂU',
}

/** Nhóm luật riêng. Hằng: chưa có bản riêng (xưng anh – bé nên không dùng bản chung) → null. */
const BY_SPECIAL: Record<string, RsvpNote | null> = {
  Hằng: null,
}

/** {p} = đại từ gọi khách: nhánh Nam → "anh", nhánh Nữ → "chị" (không ghi "anh/chị") */
const fill = (n: RsvpNote, pronoun: string): RsvpNote => ({ ...n, paragraphs: n.paragraphs.map((t) => t.replaceAll('{p}', pronoun)) })

export function rsvpNoteFor(g: Pick<Guest, 'fullName' | 'gender'> | null | undefined): RsvpNote | null {
  if (!g) return null
  const sp = specialGuest(g.fullName)
  const base = sp ? BY_SPECIAL[sp.nameWord] ?? null : GENERAL
  return base ? fill(base, g.gender === 'nu' ? 'chị' : 'anh') : null
}
