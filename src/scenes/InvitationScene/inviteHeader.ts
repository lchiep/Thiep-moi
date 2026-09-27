/**
 * Bố cục HEADER thiệp — DÙNG CHUNG cho thiệp DOM (InvitationScene) và texture thiệp 3D
 * (drawInvitationCard) để lúc camera zoom vào hai bản khớp nhau.
 *  y  = vị trí đường chân chữ, tính theo % chiều cao tờ giấy
 *  fs = cỡ chữ theo % bề ngang KHUNG ĐIỆN THOẠI (cqw); tờ giấy rộng PAPER_CQW cqw
 */
export const PAPER_CQW = 91
export const HEAD = {
  // LEVEL 1 — kicker: nhỏ (~40% headline), chữ C trang trí lớn hơn
  kicker: { y: 0.108, fs: 4.1, cap: 8.6, weight: 600, spacing: 0.08 },
  // LEVEL 2+3 — một khối headline: LỄ VINH DANH (lớn nhất) + GRADUATION GALA 2026 (gần bằng, thoáng chữ)
  title: { y: 0.153, fs: 9.6, weight: 700, spacing: 0.02 },
  subtitle: { y: 0.192, fs: 6.9, weight: 700, spacing: 0.02 },
  // khoảng trống rõ giữa "thông tin sự kiện" và "thông tin khách"
  // LEVEL 4 — "TRÂN TRỌNG KÍNH MỜI": label vàng champagne, nhỏ, nhẹ
  // 3 dòng khách nằm GIỮA 2 nhành lá vàng của giấy mới (lá ở ~22.7%–33% chiều cao)
  label: { y: 0.243, fs: 4.8, weight: 800, spacing: 0.06 },
  // LEVEL 5 — HỌ VÀ TÊN khách, in hoa, vàng, đậm hơn
  fullName: { y: 0.28, fs: 5.6, weight: 700, spacing: 0.03 },
  // LEVEL 6 — "Anh/Chị + tên gọi thân mật": chữ viết tay (Luxurious Script), lớn, vàng
  name: { y: 0.327, fs: 11, weight: 400, spacing: 0 },
  /** vùng nội dung cuộn bắt đầu ở đây (khung lá của ảnh giấy) */
  contentTop: 0.377, // giấy mới (27/09): khung lá bắt đầu ở 37.7%, kết thúc 95.5%, trái 3.5% · phải 95.9%
} as const
export const HEAD_COLOR = { ink: '#1c1a18', gold: '#a88a4a' } as const

/** Họ tên dài → thu nhỏ chữ để nằm gọn GIỮA 2 nhành lá (≈56% bề ngang giấy). Dùng chung cho texture 3D. */
export function fitFs(name: string, base: number) {
  const n = Math.max(1, name.trim().length)
  return Math.min(base, 58 / (n * 0.62))
}
