/**
 * Ảnh nhánh Nữ + vị trí từng vật trong cảnh tulip.
 * Toạ độ theo "tấm ảnh" nền 768×1376 (C3: lụa + đá). Bố cục theo ảnh mẫu Hiệp gửi (28/09, ảnh đúng khổ màn 390×844 → toạ độ tấm = 66 + x·0.746, y·0.746):
 * bó hoa bên trái đè lên mép trái phong bì · phong bì to ở giữa-phải, dấu sáp ở mũi nắp (giữa phong bì)
 * · KitKat dưới-phải · cánh hoa rải trên-phải và dưới.
 * Bó hoa + cánh hoa: ảnh tách nền Hiệp gửi. KitKat: tách từ C2. Phong bì: E2 (mở) + E1 (đóng).
 */
import { drawTicket, TICKET_FONTS } from '../../components/Ticket/drawTicket'
import { drawInvitationCard, CARD_SIZE } from '../../components/DocumentFolder/drawInvitationCard'
import { fontsReady, makeCanvas } from '../../utils/paperCanvas'
import { ticketFromGuest, type Guest } from '../../state/guestStore'

const F = '/assets/female/'

export const FEMALE_IMG = {
  sceneBg: F + 'scene-bg.webp?v=2', // nền mới: lụa satin Hiệp gửi 28/09
  bouquet: F + 'bouquet.webp',
  bouquetShadow: F + 'bouquet-shadow.webp',
  lightmap: F + 'lightmap.webp',
  choc: F + 'choc.webp?v=3', // ?v=: đổi số mỗi lần sửa ảnh để trình duyệt không dùng bản cũ trong cache
  petal1: F + 'petal1.webp',
  petal2: F + 'petal2.webp',
  petal3: F + 'petal3.webp',
  envShadow: F + 'env-shadow.webp', // bóng phong bì vẽ sẵn (CSS nền của .fem__env-shadow) — tải trước cùng cảnh
  envBack: F + 'env-back.webp',
  envFront: F + 'env-front.webp',
  envClosed: F + 'env-closed.webp',
  envPocket: F + 'env-pocket.webp',
  flapIn: F + 'env-flap-in.webp',
  flapOut: F + 'env-flap-out.webp',
} as const

export const PLATE = { w: 768, h: 1376 }

/** [x0, y0, x1, y1] trên tấm 768×1376 (được phép âm / tràn: vật thò ra ngoài khung hình như ảnh thật) */
export type Box = readonly [number, number, number, number]

export const PLACE: Record<'bouquet' | 'choc' | 'petal1' | 'petal2' | 'petal3', Box> = {
  bouquet: [-70, 523, 494, 1408], // đẩy xuống 55 (Hiệp 29/09) — cuống tràn qua mép dưới
  choc: [450, 932, 690, 1278],
  petal1: [612, 748, 692, 821],
  petal2: [337, 1207, 407, 1313],
  petal3: [800, 1300, 860, 1380], // ngoài khung — bố cục mẫu chỉ có 2 cánh
}

/** Cánh hoa rải thêm cho đỡ trống: [ảnh 1|2|3, khung, góc xoay] */
export const SCATTER: readonly [1 | 2 | 3, Box, number][] = [
  [1, [548, 318, 618, 420], 28],
  [3, [118, 236, 186, 312], -22],
  [2, [404, 1086, 466, 1180], 64],
  [1, [468, 828, 528, 916], -38],
  [3, [178, 1284, 240, 1360], 16],
]

/** Chỗ phong bì nằm (khung THÂN phong bì, tỉ lệ 582×435) — trên tấm lụa phía trên bó hoa, nằm chéo (xoay ở ENVELOPE_TILT). */
export const ENVELOPE_TILT = 9 // độ; số dương = chéo từ trái xuống phải
export const ENVELOPE_SPOT: Box = [244, 352, 684, 681] // nhích lên + sang phải cho bó hoa đè ít nhất (Hiệp 29/09)


/** Tải + giải mã trước toàn bộ ảnh (gọi lúc khách bấm GỬI) → cảnh không bị hiện dần từng ảnh. */
export function preloadFemaleAssets() {
  return Promise.all(
    Object.values(FEMALE_IMG).map(
      (src) =>
        new Promise<void>((ok) => {
          const img = new Image()
          img.src = src
          img.decode().then(ok, ok) // lỗi 1 ảnh không chặn cả cảnh
        }),
    ),
  )
}

export const pct = (b: Box) => ({
  left: `${(b[0] / PLATE.w) * 100}%`,
  top: `${(b[1] / PLATE.h) * 100}%`,
  width: `${((b[2] - b[0]) / PLATE.w) * 100}%`,
})

/**
 * VÉ + THƯ nằm trong phong bì — dùng CHUNG với nhánh Nam: vé = drawTicket (vé ngang), thư = NGUYÊN tờ thiệp
 * drawInvitationCard (dọc, 760×1647). Trong phong bì chỉ ló phần đầu tờ thiệp; phần dưới bị túi che + cắt ở đáy phong bì.
 * Vẽ sẵn lúc khách bấm GỬI, giữ ở đây để cảnh mở phong bì dùng ngay.
 */
/** Viền ĐỎ ĐÔ đặc bao NGOÀI tờ thiệp (Hiệp: thư trong phong bì phải có "phông đỏ") — px trên khổ tờ thiệp 760 */
export const LETTER_FRAME = 34
export const LETTER_SIZE = { w: CARD_SIZE.w + 2 * LETTER_FRAME, h: CARD_SIZE.h + 2 * LETTER_FRAME }
export const LETTER_RATIO = LETTER_SIZE.h / LETTER_SIZE.w
let cards: { ticket: string; letter: string } = { ticket: '', letter: '' }
export const getCards = () => cards

export async function buildCards(guest: Guest) {
  await fontsReady([...TICKET_FONTS, '400 60px "Luxurious Script"', '700 40px "Cormorant Garamond"', '600 22px "Cormorant Garamond"'])
  const t = ticketFromGuest(guest)
  const ticket = await drawTicket(t)

  // THƯ = NGUYÊN tờ thiệp như nhánh Nam (Hiệp 29/09: "hiện cái thư thật như ở bên nhánh Nam")
  // (tờ thiệp nằm trên 1 tấm bìa đỏ đô — viền ngoài; phần giấy bên trong trùng khít tờ thiệp DOM của màn thiệp)
  const card = await drawInvitationCard(t.guestFullName, t.guestAddress)
  const B = LETTER_FRAME
  const { canvas: letter, ctx: g } = makeCanvas(LETTER_SIZE.w, LETTER_SIZE.h)
  g.fillStyle = '#7a1f2b'
  g.fillRect(0, 0, LETTER_SIZE.w, LETTER_SIZE.h)
  const tex = g.createLinearGradient(0, 0, LETTER_SIZE.w, LETTER_SIZE.h) // ánh sáng nhẹ trên bìa cho khỏi phẳng
  tex.addColorStop(0, 'rgba(255,255,255,0.07)'); tex.addColorStop(0.5, 'rgba(0,0,0,0.06)'); tex.addColorStop(1, 'rgba(255,255,255,0.04)')
  g.fillStyle = tex
  g.fillRect(0, 0, LETTER_SIZE.w, LETTER_SIZE.h)
  g.strokeStyle = 'rgba(184,150,90,0.75)' // nét vàng nhạt sát mép giấy
  g.lineWidth = 2
  g.strokeRect(B - 9, B - 9, CARD_SIZE.w + 18, CARD_SIZE.h + 18)
  g.drawImage(card, B, B)

  cards = { ticket: ticket.toDataURL('image/webp', 0.92), letter: letter.toDataURL('image/webp', 0.92) }
  return cards
}
