import { EVENT } from '../../config/event'
import type { TicketData } from '../../state/guestStore'
import { loadImage } from '../../utils/image'
import { makeCanvas, text, type Ctx } from '../../utils/paperCanvas'

/**
 * VÉ DÙNG CHUNG cho cả hai nhánh (Nam: trong tập tài liệu, Nữ: ra khỏi phong bì).
 *
 * Nền vé = ảnh mẫu Hiệp chọn (vé NGANG, cuống bên phải), đã tách nền và xoá
 * các chỗ điền: `public/assets/tickets/ticket-template.webp` (1608×635, có alpha).
 * Code chỉ điền phần riêng của từng khách: biệt danh, ảnh, số liên hệ, mã vé.
 * Toạ độ đo trên ảnh mẫu (px của template).
 */
export const TICKET_SIZE = { w: 1608, h: 635 } as const
const TEMPLATE_URL = '/assets/tickets/ticket-template.webp'

const SPOT = {
  invitee: { x: 234, y: 372, maxW: 440 }, // cạnh nhãn INVITEE:
  date: { x: 128, y: 306 }, // cạnh icon lịch (template đã xoá chữ ngày cũ)
  host: { x: 232, y: 424 }, // cạnh nhãn HOST:
  contact: { x: 232, y: 463 }, // cạnh nhãn CONTACT:
  venue: { x: 232, y: 511, lh: 29, maxW: 528 }, // cạnh nhãn VENUE: (2 dòng tên trường + 1 dòng địa chỉ)
  ticketNo: { x: 1560, y: 318 }, // chữ dọc trên cuống
  photo: { x: 812, y: 103, w: 368, h: 451, r: 16 }, // lòng khung ảnh (góc lõm)
} as const

const INK = { burgundy: '#4f1520', charcoal: '#2a2420', gold: '#9a7a45' } as const

/**
 * FONT CHỮ THÔNG TIN TRÊN VÉ (host, contact, venue, địa chỉ).
 * Hiệp chọn 1 trong 6 bộ (xem ảnh so sánh) — đổi TICKET_TYPE là xong.
 * Font nào ngoài Cormorant Garamond thì phải thêm vào link Google Fonts ở index.html.
 */
export const TICKET_TYPE_OPTIONS = {
  cormorant: { value: '600 26px "Cormorant Garamond"', address: 'italic 500 22px "Cormorant Garamond"' },
  cormorantSC: { value: '600 26px "Cormorant SC"', address: '600 21px "Cormorant SC"' },
  ebGaramond: { value: '500 23px "EB Garamond"', address: 'italic 500 20px "EB Garamond"' },
  playfair: { value: '500 22px "Playfair Display"', address: 'italic 400 19px "Playfair Display"' },
  notoDisplay: { value: '500 24px "Noto Serif Display"', address: '500 19px "Noto Serif Display"' },
  prata: { value: '400 21px Prata', address: '400 17px Prata' },
} as const
export const TICKET_TYPE: keyof typeof TICKET_TYPE_OPTIONS = 'ebGaramond'
const TYPE = TICKET_TYPE_OPTIONS[TICKET_TYPE]

export const TICKET_FONTS = [
  TYPE.value,
  TYPE.address,
  '400 70px "Luxurious Script"',
  '600 24px "Cormorant Garamond"',
  '700 24px "Cormorant Garamond"',
  '500 22px Cinzel',
]

let template: Promise<HTMLImageElement> | null = null
const getTemplate = () => (template ??= loadImage(TEMPLATE_URL))

export async function drawTicket(t: TicketData) {
  const { w, h } = TICKET_SIZE
  const { canvas, ctx } = makeCanvas(w, h)
  ctx.drawImage(await getTemplate(), 0, 0, w, h)

  await drawPhoto(ctx, t.guestPhoto, t.guestPhotoFocus)

  // biệt danh: chữ viết tay đỏ đô như dòng mẫu "[Invitee Name]"
  // INVITEE = họ và tên đầy đủ khách nhập (biệt danh dùng ở chỗ khác)
  text(ctx, t.guestFullName, {
    font: '400 70px "Luxurious Script"', color: INK.burgundy,
    x: SPOT.invitee.x, y: SPOT.invitee.y, maxWidth: SPOT.invitee.maxW,
  })
  text(ctx, `${EVENT.timeLabel}  •  ${EVENT.dateLabel}`, { font: '500 22px Cinzel', color: INK.charcoal, x: SPOT.date.x, y: SPOT.date.y, spacing: 2 })
  text(ctx, EVENT.host, { font: TYPE.value, color: INK.charcoal, x: SPOT.host.x, y: SPOT.host.y, spacing: 1.5 })
  text(ctx, EVENT.contact, { font: TYPE.value, color: INK.charcoal, x: SPOT.contact.x, y: SPOT.contact.y, spacing: 1.5 })
  const v = SPOT.venue
  // tên trường ngắt đúng chỗ " AND " cho cân 2 dòng; tên khác thì tự ngắt theo bề rộng
  const at = EVENT.venue.indexOf(' AND ')
  const lines = (at > 0 ? [EVENT.venue.slice(0, at), EVENT.venue.slice(at + 1)] : wrap(ctx, EVENT.venue, TYPE.value, v.maxW)).slice(0, 2)
  lines.forEach((l, i) => text(ctx, l, { font: TYPE.value, color: INK.charcoal, x: v.x, y: v.y + i * v.lh, spacing: 1 }))
  text(ctx, titleCase(EVENT.address), {
    font: TYPE.address, color: '#5b5048', x: v.x, y: v.y + lines.length * v.lh + 1, spacing: 0.5, maxWidth: v.maxW,
  })

  // mã vé chạy dọc, đọc từ dưới lên như chữ "CLASS OF 2026" bên cạnh
  ctx.save()
  ctx.translate(SPOT.ticketNo.x, SPOT.ticketNo.y)
  ctx.rotate(-Math.PI / 2)
  text(ctx, `TICKET NO.  ${t.ticketNo}`, {
    font: '500 15px Cinzel', color: INK.gold, x: 0, y: 6, align: 'center', spacing: 4,
  })
  ctx.restore()
  return canvas
}

/** Khung chữ nhật có 4 góc lõm (giống khung ảnh trên vé). */
function concaveRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arc(x + w, y, r, Math.PI, Math.PI / 2, true)
  ctx.lineTo(x + w, y + h - r)
  ctx.arc(x + w, y + h, r, -Math.PI / 2, Math.PI, true)
  ctx.lineTo(x + r, y + h)
  ctx.arc(x, y + h, r, 0, -Math.PI / 2, true)
  ctx.lineTo(x, y + r)
  ctx.arc(x, y, r, Math.PI / 2, 0, true)
  ctx.closePath()
}

async function drawPhoto(ctx: Ctx, src: string | null, focus: { x: number; y: number }) {
  const { x, y, w, h, r } = SPOT.photo
  ctx.save()
  concaveRect(ctx, x - 1, y - 1, w + 2, h + 2, r)
  ctx.clip()
  let drawn = false
  if (src) {
    try {
      const img = await loadImage(src)
      const s = Math.max(w / img.width, h / img.height) // object-fit: cover, ưu tiên phần mặt (trên)
      const sw = w / s
      const sh = h / s
      // cắt kiểu object-fit: cover nhưng đặt TÂM KHUÔN MẶT vào giữa khung (kẹp trong ảnh)
      const sx = Math.min(Math.max(focus.x * img.width - sw / 2, 0), img.width - sw)
      const sy = Math.min(Math.max(focus.y * img.height - sh / 2, 0), img.height - sh)
      ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
      // ảnh in lên giấy: hơi ấm + tối mép cho khớp giấy vé
      ctx.globalCompositeOperation = 'multiply'
      ctx.fillStyle = 'rgba(240,228,205,0.35)'
      ctx.fillRect(x, y, w, h)
      ctx.globalCompositeOperation = 'source-over'
      drawn = true
    } catch {
      /* dùng placeholder */
    }
  }
  if (!drawn) {
    ctx.fillStyle = '#e6dfd2'
    ctx.fillRect(x, y, w, h)
    text(ctx, 'H', { font: '400 200px "Luxurious Script"', color: 'rgba(79,21,32,0.35)', x: x + w / 2, y: y + h / 2 + 70, align: 'center' })
  }
  const v = ctx.createRadialGradient(x + w / 2, y + h / 2, h * 0.35, x + w / 2, y + h / 2, h * 0.75)
  v.addColorStop(0, 'rgba(60,40,20,0)')
  v.addColorStop(1, 'rgba(60,40,20,0.18)')
  ctx.fillStyle = v
  ctx.fillRect(x, y, w, h)
  ctx.restore()
}

/** Ngắt dòng theo bề rộng (dùng cho tên địa điểm dài). */
function wrap(ctx: Ctx, str: string, font: string, maxW: number) {
  ctx.save()
  ctx.font = font
  const out: string[] = []
  let line = ''
  for (const w of str.split(/\s+/)) {
    const next = line ? `${line} ${w}` : w
    if (ctx.measureText(next).width > maxW && line) {
      out.push(line)
      line = w
    } else line = next
  }
  if (line) out.push(line)
  ctx.restore()
  return out
}

/** "29A NGÕ 124 PHỐ VĨNH TUY" → "29A Ngõ 124 Phố Vĩnh Tuy" (giữ nguyên từ có chữ số). */
function titleCase(str: string) {
  return str
    .toLocaleLowerCase('vi')
    .split(' ')
    .map((w) => (/\d/.test(w) ? w.toLocaleUpperCase('vi') : w.charAt(0).toLocaleUpperCase('vi') + w.slice(1)))
    .join(' ')
}
