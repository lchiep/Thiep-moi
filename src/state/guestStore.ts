import { COPY } from '../config/copy'
import { create } from 'zustand'
import type { GuestForm } from '../components/GlassPopup/GlassPopup'
import { compressImage } from '../utils/image'
import { findFocus, type Focus } from '../utils/faceFocus'

/**
 * Hồ sơ khách — nguồn dữ liệu DUY NHẤT cho vé, thiệp, tên hiển thị.
 * Phase 6 (sau): gửi lên Supabase `register_guest` để lấy mã vé chính thức.
 * Hiện tại: lưu trên máy (localStorage), mã vé tạm GH26-XXXX không đổi trong phiên.
 */
export type Guest = {
  id: string
  fullName: string
  nickname: string
  phone: string
  cccd: string
  gender: 'nu' | 'nam'
  email: string
  dob: string
  hobbies: string
  description: string
  photo: string | null // dataURL đã nén ~600px
  photoFocus: Focus // tâm khuôn mặt (0–1) để cắt ảnh đúng chỗ
  ticketNo: string
}

const KEY = 'gg26.guest'

function newId() {
  return crypto.randomUUID?.() ?? `g-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
function tempTicketNo() {
  return `GH26-${String(Math.floor(1000 + Math.random() * 9000))}`
}

function readSaved(): Guest | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Guest) : null
  } catch {
    return null
  }
}

type Store = {
  guest: Guest | null
  saveFromForm: (f: GuestForm) => Promise<Guest>
}

export const useGuest = create<Store>((set, get) => ({
  guest: readSaved(),
  saveFromForm: async (f) => {
    const prev = get().guest
    const photo = f.photo ? await compressImage(f.photo, 600) : prev?.photo ?? null
    const photoFocus = f.photo && photo ? await findFocus(photo) : prev?.photoFocus ?? { x: 0.5, y: 0.35 }
    const guest: Guest = {
      id: prev?.id ?? newId(),
      fullName: f.fullName.trim(),
      nickname: f.nickname.trim(),
      phone: f.phone.replace(/\s/g, ''),
      cccd: f.cccd.trim(),
      gender: f.gender === 'nu' ? 'nu' : 'nam',
      email: f.email.trim(),
      dob: f.dob,
      hobbies: f.hobbies.trim(),
      description: f.description.trim(),
      photo,
      photoFocus,
      ticketNo: prev?.ticketNo ?? tempTicketNo(),
    }
    set({ guest })
    try {
      localStorage.setItem(KEY, JSON.stringify(guest))
    } catch {
      /* hết chỗ / chế độ riêng tư: vẫn chạy bằng bộ nhớ */
    }
    return guest
  },
}))

/** Họ và tên có chứa ĐÚNG 1 chữ (so cả chữ, không phân biệt hoa/thường, chuẩn hoá dấu tiếng Việt)? */
const nameHasWord = (fullName: string, word: string) => {
  const norm = (x: string) => x.normalize('NFC').toLocaleLowerCase('vi')
  const w = norm(word)
  return norm(fullName).split(/\s+/).includes(w)
}

/** Luật riêng theo tên khách (COPY.specialGuests) — vd. họ tên có chữ "Hằng". */
export const specialGuest = (fullName: string) => COPY.specialGuests.find((r) => nameHasWord(fullName, r.nameWord))

/**
 * Xưng hô trên thiệp: Nam → "Anh", Nữ → "Chị" + tên gọi thân mật (không có thì dùng họ tên).
 * Luật riêng: họ tên có chữ "Hằng" → "Bé" + biệt danh (thay cho Anh/Chị).
 */
export const guestAddress = (g: Pick<Guest, 'gender' | 'nickname' | 'fullName'>) =>
  `${specialGuest(g.fullName)?.honorific ?? COPY.invitationHeader.honorific[g.gender]} ${g.nickname || g.fullName}`

/** Kiểu chữ "nới" (bỏ ràng buộc literal của `as const`) để bản riêng thay được bản chung. */
type Widen<T> = T extends string ? string : T extends readonly (infer U)[] ? readonly Widen<U>[] : { readonly [K in keyof T]: Widen<T[K]> }
export type Sections = Widen<typeof COPY.sections>

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x)
const merge = (base: unknown, over: unknown): unknown => {
  if (!isObj(base) || !isObj(over)) return over === undefined ? base : over // chuỗi / mảng: thay nguyên
  const out: Record<string, unknown> = { ...base }
  for (const k of Object.keys(over)) out[k] = merge(base[k], over[k])
  return out
}
/** Chữ trong thư cho khách này: bản chung, ghi đè bằng bản riêng nếu khách thuộc luật riêng (vd. Hằng → xưng "anh – bé"). */
export const sectionsFor = (fullName: string): Sections => {
  const r = specialGuest(fullName)
  return (r ? merge(COPY.sections, r.sections) : COPY.sections) as Sections
}

/** Dữ liệu vé suy ra từ khách + sự kiện (không hard-code trong component). */
export type TicketData = {
  guestName: string
  /** "Anh Hiệp" / "Chị Linh" — xưng hô theo giới tính + tên gọi thân mật (dòng thư pháp trên thiệp) */
  guestAddress: string
  guestFullName: string
  guestPhoto: string | null
  guestPhotoFocus: Focus
  ticketNo: string
}
export const ticketFromGuest = (g: Guest): TicketData => ({
  guestName: g.nickname || g.fullName,
  guestAddress: guestAddress(g),
  guestFullName: g.fullName,
  guestPhoto: g.photo,
  guestPhotoFocus: g.photoFocus ?? { x: 0.5, y: 0.35 },
  ticketNo: g.ticketNo,
})
