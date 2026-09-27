/**
 * Token chuyển động dùng chung cho GSAP.
 * Quy tắc: không dùng linear; vật nặng chậm, vật nhẹ nhanh.
 */
export const EASE = {
  ui: 'power2.out',            // nút, chữ, phản hồi chạm
  paper: 'power3.out',         // giấy, vé, thư trượt ra (có quán tính nhẹ)
  heavy: 'power4.inOut',       // tập tài liệu, phong bì di chuyển
  cinematic: 'expo.inOut',     // chuyển cảnh lớn
  settle: 'back.out(1.2)',     // nảy rất nhẹ khi dừng (không lạm dụng)
  sway: 'sine.inOut',          // hoa đung đưa, vật lơ lửng
} as const

export const DUR = {
  tap: 0.12,       // nhấn xuống
  micro: 0.3,
  ui: 0.45,
  paper: 1.05,
  heavy: 1.6,      // folder trồi lên 1.4–1.8s
  scene: 1.4,
  idle: 3.2,
} as const

/** Nhịp mở phong bì theo spec (giây). */
export const ENVELOPE_OPEN = {
  press: 0.12,     // 0–120ms scale .98
  lift: 0.18,      // 120–300ms nhấc + nghiêng
  flapStart: 0.3,  // 300ms nắp bắt đầu mở
  flapOpen: 0.48,  // 480ms nắp mở hẳn
} as const

export const PARALLAX_PX = {
  background: 6,   // 4–8px
  midground: 11,   // 8–14px
  foreground: 16,  // 12–20px
} as const

export const SWIPE = {
  threshold: 0.82, // 80–85%
  resistance: 0.35,
} as const
