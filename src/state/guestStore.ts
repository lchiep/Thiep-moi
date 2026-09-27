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

/** Xưng hô trên thiệp: Nam → "Anh", Nữ → "Chị" + tên gọi thân mật (không có thì dùng họ tên). */
export const guestAddress = (g: Pick<Guest, 'gender' | 'nickname' | 'fullName'>) =>
  `${COPY.invitationHeader.honorific[g.gender]} ${g.nickname || g.fullName}`

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
