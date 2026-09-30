import { supabase, PHOTO_BUCKET } from './supabase'
import { compressImage } from '../utils/image'
import type { Guest } from '../state/guestStore'

/**
 * Lưu MỌI thông tin khách điền ở popup lên Supabase (chạy nền, không làm chậm hiệu ứng):
 *  1. mở popup → giữ chỗ 1 mã vé chính thức (GH26-0001, 0002…) để vé khách thấy khớp với dữ liệu
 *  2. bấm GỬI → tải ảnh (1200px) lên bucket riêng tư → gọi register_guest với toàn bộ thông tin
 *  3. mất mạng → giữ bản chờ trên máy, gửi lại khi có mạng / lần mở sau
 * Chế độ kiểm thử (?qa) không gửi gì lên server.
 */
const QA = typeof location !== 'undefined' && new URLSearchParams(location.search).has('qa')
const PENDING = 'gg26.pending'

let reserved: Promise<string | null> | null = null
/** Gọi khi popup mở. Trả mã vé đã giữ (hoặc null nếu không có mạng / chưa cấu hình). */
export function reserveTicket() {
  if (QA) return Promise.resolve(null)
  if (!reserved) {
    reserved = supabase()
      .then(async (sb) => {
        if (!sb) return null
        const { data, error } = await sb.rpc('reserve_ticket')
        if (error) throw error
        return data as string
      })
      .catch((e) => {
        console.warn('[supabase] giữ mã vé lỗi', e)
        reserved = null // lần sau thử lại
        return null
      })
  }
  return reserved
}

/** Mã vé đã giữ nếu CÓ SẴN ngay (không chờ mạng). */
let reservedNow: string | null = null
export const reservedTicket = () => reservedNow
export function warmTicket() {
  void reserveTicket().then((t) => { if (t) reservedNow = t })
}

type Row = Omit<Guest, 'photo' | 'photoFocus'> & { photoPath: string | null }

async function uploadPhoto(id: string, file: File): Promise<string | null> {
  const sb = await supabase()
  if (!sb) return null
  const dataUrl = await compressImage(file, 1200, 0.86)
  const blob = await (await fetch(dataUrl)).blob()
  const path = `${id}/${Date.now()}.jpg`
  const { error } = await sb.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (error) throw error
  return path
}

async function register(r: Row): Promise<string | null> {
  const sb = await supabase()
  if (!sb) return null
  const { data, error } = await sb.rpc('register_guest', {
    p_id: r.id,
    p_ticket_no: r.ticketNo,
    p_full_name: r.fullName,
    p_nickname: r.nickname,
    p_phone: r.phone,
    p_cccd: r.cccd,
    p_gender: r.gender,
    p_email: r.email,
    p_dob: r.dob || null,
    p_hobbies: r.hobbies,
    p_description: r.description,
    p_photo_path: r.photoPath,
  })
  if (error) throw error
  return data as string
}

const savePending = (r: Row | null) => {
  try {
    if (r) localStorage.setItem(PENDING, JSON.stringify(r))
    else localStorage.removeItem(PENDING)
  } catch { /* chế độ riêng tư */ }
}

/**
 * Gửi hồ sơ khách lên server (không chờ). `onTicket` được gọi nếu server trả mã vé khác mã đang dùng (hiếm).
 */
export async function syncGuest(g: Guest, photo: File | null, onTicket: (t: string) => void) {
  if (QA) return
  const { photo: _p, photoFocus: _f, ...rest } = g
  const row: Row = { ...rest, photoPath: null }
  try {
    if (photo) {
      row.photoPath = await uploadPhoto(g.id, photo).catch((e) => {
        console.warn('[supabase] tải ảnh lỗi', e)
        return null
      })
    }
    const t = await register(row)
    savePending(null)
    if (t && t !== g.ticketNo) onTicket(t)
  } catch (e) {
    console.warn('[supabase] lưu khách lỗi — sẽ gửi lại khi có mạng', e)
    savePending(row)
  }
}

/** Gửi lại bản chờ (nếu lần trước mất mạng). Gọi lúc mở web + khi có mạng lại. */
export function flushPending(onTicket: (t: string) => void) {
  if (QA) return
  let r: Row | null = null
  try { r = JSON.parse(localStorage.getItem(PENDING) || 'null') as Row | null } catch { r = null }
  if (!r) return
  const row = r
  void register(row)
    .then((t) => { savePending(null); if (t && t !== row.ticketNo) onTicket(t) })
    .catch(() => { /* vẫn chờ */ })
}
