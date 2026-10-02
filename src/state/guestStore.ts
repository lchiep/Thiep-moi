import { COPY } from '../config/copy'
import { fillDeep, relOf, type Relationship } from '../config/relationship'
import { create } from 'zustand'
import type { GuestForm } from '../components/GlassPopup/GlassPopup'
import { compressImage } from '../utils/image'
import { findFocus, type Focus } from '../utils/faceFocus'
import { flushPending, reservedTicket, syncGuest } from '../api/guestSync'

/**
 * Hồ sơ khách — nguồn dữ liệu DUY NHẤT cho vé, thiệp, tên hiển thị.
 * Lưu trên máy (localStorage) + gửi lên Supabase khi khách bấm GỬI (`submit`, xem src/api/guestSync.ts).
 * Mã vé: mã chính thức đã giữ chỗ lúc mở popup (GH26-0001…); không có mạng thì mã tạm, server cấp lại sau.
 */
export type Guest = {
  id: string
  fullName: string
  nickname: string
  phone: string
  /** quan hệ với Hiệp (ô Relationship) → xưng hô trong thư. Khách lưu từ bản cũ không có → coi là bạn bè */
  relationship?: Relationship
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

/**
 * Nén ảnh + dò khuôn mặt làm NGAY khi khách chọn ảnh (nền, trong lúc khách còn điền form) → lúc bấm GỬI đã xong sẵn,
 * hiệu ứng chuyển cảnh chạy liền, không phải đợi. Cache theo File.
 */
const photoPrep = new WeakMap<File, Promise<{ photo: string; focus: Focus }>>()
export function prepPhoto(file: File) {
  let p = photoPrep.get(file)
  if (!p) {
    p = compressImage(file, 600).then(async (photo) => ({ photo, focus: await findFocus(photo) }))
    photoPrep.set(file, p)
  }
  return p
}

type Store = {
  guest: Guest | null
  saveFromForm: (f: GuestForm) => Promise<Guest>
  /** Khách bấm GỬI: lưu trên máy + gửi toàn bộ thông tin (kèm ảnh) lên Supabase ở nền. */
  submit: (f: GuestForm) => Promise<Guest>
  setTicketNo: (t: string) => void
}

export const useGuest = create<Store>((set, get) => ({
  guest: readSaved(),
  saveFromForm: async (f) => {
    const prev = get().guest
    const prepped = f.photo ? await prepPhoto(f.photo) : null
    const photo = prepped?.photo ?? prev?.photo ?? null
    const photoFocus = prepped?.focus ?? prev?.photoFocus ?? { x: 0.5, y: 0.35 }
    const guest: Guest = {
      id: prev?.id ?? newId(),
      fullName: f.fullName.trim(),
      nickname: f.nickname.trim(),
      phone: f.phone.replace(/\s/g, ''),
      relationship: f.relationship || 'ban',
      // luật riêng (vd. tên Hằng) khoá giới tính → luôn đúng nhánh dù form gửi gì
      gender: specialGuest(f.fullName)?.lockGender ?? (f.gender === 'nu' ? 'nu' : 'nam'),
      email: f.email.trim(),
      dob: f.dob,
      hobbies: f.hobbies.trim(),
      description: f.description.trim(),
      photo,
      photoFocus,
      ticketNo: prev?.ticketNo ?? reservedTicket() ?? tempTicketNo(),
    }
    set({ guest })
    try {
      localStorage.setItem(KEY, JSON.stringify(guest))
    } catch {
      /* hết chỗ / chế độ riêng tư: vẫn chạy bằng bộ nhớ */
    }
    return guest
  },
  submit: async (f) => {
    const guest = await get().saveFromForm(f)
    void syncGuest(guest, f.photo, get().setTicketNo)
    return guest
  },
  setTicketNo: (ticketNo) => {
    const g = get().guest
    if (!g || g.ticketNo === ticketNo) return
    const guest = { ...g, ticketNo }
    set({ guest })
    try {
      localStorage.setItem(KEY, JSON.stringify(guest))
    } catch {
      /* bỏ qua */
    }
  },
}))

// lần trước mất mạng → gửi lại khi mở web / khi có mạng lại
if (typeof window !== 'undefined') {
  const flush = () => flushPending((t) => useGuest.getState().setTicketNo(t))
  flush()
  window.addEventListener('online', flush)
}

/**
 * Khách ĐÃ đăng ký trên máy/trình duyệt này (hồ sơ còn trong localStorage, có ảnh) → mở lại link không phải điền popup nữa.
 * Thêm `?moi` vào link để buộc điền lại (vd. máy dùng chung). Chế độ kiểm thử (?qa) luôn hiện form.
 */
export function returningGuest(): Guest | null {
  const q = new URLSearchParams(location.search)
  if (q.has('moi') || q.has('sua') || (q.has('qa') && !q.has('back'))) return null // test khách quay lại: ?qa&back
  const g = useGuest.getState().guest
  return g && g.fullName && g.photo && (g.gender === 'nam' || g.gender === 'nu') ? g : null
}

/** Khách bấm "← Sửa thông tin" (link có ?sua): popup mở với thông tin cũ điền sẵn, gửi lại thì cập nhật đúng hồ sơ cũ (giữ mã vé). */
export const editingGuest = (): Guest | null =>
  new URLSearchParams(location.search).has('sua') ? useGuest.getState().guest : null

/** Ảnh đã lưu (dataURL) → File để ô ảnh của popup hiện lại và gửi lại được. */
export function photoFile(dataUrl: string | null): File | null {
  if (!dataUrl?.startsWith('data:')) return null
  try {
    const [head, b64] = dataUrl.split(',')
    const type = /data:([^;]+)/.exec(head)?.[1] ?? 'image/jpeg'
    const bin = atob(b64)
    const buf = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
    return new File([buf], 'anh-cua-ban.jpg', { type })
  } catch {
    return null
  }
}

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
export const guestAddress = (g: Pick<Guest, 'gender' | 'nickname' | 'fullName' | 'relationship'>) => {
  const sp = specialGuest(g.fullName)
  if (sp) return `${sp.honorific} ${g.nickname || g.fullName}`
  const r = relOf(g.relationship)
  if (r.alone && r.title) return r.title // Bố / Mẹ: không kèm tên
  return `${r.title ?? COPY.invitationHeader.honorific[g.gender]} ${g.nickname || g.fullName}`
}

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
export const sectionsFor = (g: Pick<Guest, 'fullName' | 'relationship'>): Sections => {
  const r = specialGuest(g.fullName)
  const base = (r ? merge(COPY.sections, r.sections) : COPY.sections) as Sections
  // xưng hô theo Relationship: {g}/{s} → bạn–mình / anh–em / bố–con / chú–cháu …
  return fillDeep(base, g.relationship)
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
