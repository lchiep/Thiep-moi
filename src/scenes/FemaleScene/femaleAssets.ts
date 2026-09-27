/**
 * Ảnh nhánh Nữ + vị trí từng vật trong cảnh tulip.
 * Toạ độ theo "tấm ảnh" nền 768×1376 (C3: lụa + đá). Bố cục theo ảnh mẫu Hiệp gửi (27/09):
 * bó hoa bên trái đè lên mép trái phong bì · phong bì to ở giữa-phải, dấu sáp ở mũi nắp (giữa phong bì)
 * · KitKat dưới-phải · cánh hoa rải trên-phải và dưới.
 * Bó hoa + cánh hoa: ảnh tách nền Hiệp gửi. KitKat: tách từ C2. Phong bì: E2 (mở) + E1 (đóng).
 */
import { drawInvitationCard, CARD_SIZE } from '../../components/DocumentFolder/drawInvitationCard'
import { drawTicket, TICKET_FONTS } from '../../components/Ticket/drawTicket'
import { fontsReady } from '../../utils/paperCanvas'
import { ticketFromGuest, type Guest } from '../../state/guestStore'

const F = '/assets/female/'

export const FEMALE_IMG = {
  sceneBg: F + 'scene-bg.webp',
  bouquet: F + 'bouquet.webp',
  bouquetShadow: F + 'bouquet-shadow.webp',
  lightmap: F + 'lightmap.webp',
  choc: F + 'choc.webp',
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
  bouquet: [-150, 290, 450, 1236],
  choc: [390, 850, 702, 1342], // như ảnh gốc C2 (trên mặt đá, dưới-phải), hạ nhẹ cho khỏi lẫn dưới phong bì
  petal1: [520, 300, 640, 409],
  petal2: [636, 430, 722, 560],
  petal3: [296, 1236, 392, 1344],
}

/** Chỗ phong bì nằm (khung THÂN phong bì, tỉ lệ 582×435) — to, giữa-phải, luồn SÂU dưới bó hoa. */
export const ENVELOPE_SPOT: Box = [178, 560, 668, 926]


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
export const CARD_CROP = { y0: 0.062, y1: 0.366 } // khúc header của tờ thiệp (theo chiều cao giấy)
let cards: { ticket: string; letter: string } = { ticket: '', letter: '' }
export const getCards = () => cards

export async function buildCards(guest: Guest) {
  await fontsReady([...TICKET_FONTS, '400 150px "Luxurious Script"', '700 40px "Cormorant Garamond"', '600 32px "Cormorant Garamond"'])
  const t = ticketFromGuest(guest)
  const ticket = await drawTicket(t)
  const card = await drawInvitationCard(t.guestFullName, t.guestAddress)
  const sy = Math.round(CARD_SIZE.h * CARD_CROP.y0)
  const sh = Math.round(CARD_SIZE.h * (CARD_CROP.y1 - CARD_CROP.y0))
  const c = document.createElement('canvas')
  c.width = CARD_SIZE.w
  c.height = sh
  c.getContext('2d')!.drawImage(card, 0, sy, CARD_SIZE.w, sh, 0, 0, CARD_SIZE.w, sh)
  cards = { ticket: ticket.toDataURL('image/webp', 0.92), letter: c.toDataURL('image/webp', 0.92) }
  return cards
}
