import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Kết nối Supabase (tải thư viện khi cần, không làm nặng màn đầu).
 * Thiếu biến môi trường (chưa có .env.local) → trả null: web vẫn chạy bình thường, chỉ không lưu lên server.
 * Chỉ dùng khoá publishable — database chỉ cho khách GHI qua hàm, không đọc được bảng nào.
 */
const URL_ = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const PHOTO_BUCKET = import.meta.env.VITE_SUPABASE_PHOTO_BUCKET || 'guest-photos'

let client: Promise<SupabaseClient | null> | null = null
export function supabase() {
  if (!client) {
    client = !URL_ || !KEY
      ? Promise.resolve(null)
      : import('@supabase/supabase-js').then(({ createClient }) =>
          createClient(URL_, KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
            // gọi hàm (JSON nhỏ) với keepalive: khách đóng/chuyển trang ngay sau khi bấm gửi thì yêu cầu vẫn đi tới server
            global: {
              fetch: (input, init) => {
                const rpc = String(input).includes('/rest/v1/rpc/')
                const timeout = typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(rpc ? 15_000 : 60_000) : undefined
                return fetch(input, { ...init, ...(rpc ? { keepalive: true } : {}), signal: init?.signal ?? timeout })
              },
            },
          }))
  }
  return client
}
