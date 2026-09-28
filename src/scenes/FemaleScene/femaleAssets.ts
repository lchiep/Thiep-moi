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
import { loadImage } from '../../utils/image'
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
  bouquet: [-41, 491, 469, 1295],
  choc: [450, 932, 690, 1278],
  petal1: [612, 748, 692, 821],
  petal2: [337, 1207, 407, 1313],
  petal3: [800, 1300, 860, 1380], // ngoài khung — bố cục mẫu chỉ có 2 cánh
}

/** Chỗ phong bì nằm (khung THÂN phong bì, tỉ lệ 582×435) — trên tấm lụa phía trên bó hoa, nằm chéo (xoay ở ENVELOPE_TILT). */
export const ENVELOPE_TILT = 9 // độ; số dương = chéo từ trái xuống phải
export const ENVELOPE_SPOT: Box = [265, 401, 665, 700]


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
 * VÉ + THIỆP nằm trong phong bì — dùng CHUNG nội dung với nhánh Nam:
 *  vé = drawTicket (vé ngang), thiệp = khúc đầu tờ thiệp drawInvitationCard (giấy dó + header + tên khách).
 * Vẽ sẵn lúc khách bấm GỬI, giữ ở đây để cảnh mở phong bì dùng ngay.
 */
/**
 * Thiệp trong phong bì — thiết kế riêng cho khổ phong bì (theo ảnh tham khảo phong bì đỏ Hiệp gửi):
 * nền = giấy dó của tờ thiệp, khối chữ = NGUYÊN header tờ thiệp (như thiệp nhánh Nam) thu nhỏ còn ~56% bề ngang,
 * đặt phía trên cho thoáng · viền đỏ đô 2 nét. Nội dung chung với thiệp nhánh Nam (COPY.invitationHeader, họ tên, "Chị + tên").
 */
const PAPER = '/assets/invitation/paper.webp'
const LETTER = { w: 852, h: 613 }
let cards: { ticket: string; letter: string } = { ticket: '', letter: '' }
export const getCards = () => cards

export async function buildCards(guest: Guest) {
  await fontsReady([...TICKET_FONTS, '400 60px "Luxurious Script"', '700 40px "Cormorant Garamond"', '600 22px "Cormorant Garamond"'])
  const t = ticketFromGuest(guest)
  const ticket = await drawTicket(t)

  const { canvas: c, ctx: g } = makeCanvas(LETTER.w, LETTER.h)
  // nền: khúc giấy trơn đầu tờ (không có nhành lá) giãn ra cho đủ khổ thiệp
  g.drawImage(await loadImage(PAPER), 0, 0, LETTER.w, 380, 0, 0, LETTER.w, LETTER.h)
  // chữ: dùng NGUYÊN khối header của tờ thiệp (y hệt thiệp nhánh Nam: chữ C thư pháp, 2 nhành lá ôm tên khách),
  // thu nhỏ đặt phía trên — mép khối làm mờ dần để hoà vào giấy nền
  const card = await drawInvitationCard(t.guestFullName, t.guestAddress)
  const sy = Math.round(CARD_SIZE.h * 0.068), sh = Math.round(CARD_SIZE.h * (0.352 - 0.068))
  const blk = makeCanvas(CARD_SIZE.w, sh)
  blk.ctx.drawImage(card, 0, sy, CARD_SIZE.w, sh, 0, 0, CARD_SIZE.w, sh)
  blk.ctx.globalCompositeOperation = 'destination-in'
  const fx = blk.ctx.createLinearGradient(0, 0, CARD_SIZE.w, 0)
  fx.addColorStop(0, 'rgba(0,0,0,0)'); fx.addColorStop(0.06, '#000'); fx.addColorStop(0.94, '#000'); fx.addColorStop(1, 'rgba(0,0,0,0)')
  blk.ctx.fillStyle = fx
  blk.ctx.fillRect(0, 0, CARD_SIZE.w, sh)
  const fy = blk.ctx.createLinearGradient(0, 0, 0, sh)
  fy.addColorStop(0, 'rgba(0,0,0,0)'); fy.addColorStop(0.08, '#000'); fy.addColorStop(0.92, '#000'); fy.addColorStop(1, 'rgba(0,0,0,0)')
  blk.ctx.fillStyle = fy
  blk.ctx.fillRect(0, 0, CARD_SIZE.w, sh)
  const bw = LETTER.w * 0.56, bh = (bw / CARD_SIZE.w) * sh
  g.drawImage(blk.canvas, (LETTER.w - bw) / 2, 36, bw, bh)
  // viền đỏ đô 2 nét
  g.strokeStyle = 'rgba(122,31,43,0.85)'
  g.lineWidth = 3
  g.strokeRect(20, 20, LETTER.w - 40, LETTER.h - 40)
  g.strokeStyle = 'rgba(122,31,43,0.45)'
  g.lineWidth = 1.2
  g.strokeRect(29, 29, LETTER.w - 58, LETTER.h - 58)

  cards = { ticket: ticket.toDataURL('image/webp', 0.92), letter: c.toDataURL('image/webp', 0.92) }
  return cards
}
