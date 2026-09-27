import { COPY } from '../../config/copy'
import { loadImage } from '../../utils/image'
import { makeCanvas, text } from '../../utils/paperCanvas'
import { HEAD, HEAD_COLOR, PAPER_CQW, fitFs } from '../../scenes/InvitationScene/inviteHeader'

/**
 * Thiệp kẹp bên trái tập tài liệu = CHÍNH tờ thiệp của màn thiệp (cùng giấy dó, cùng
 * vị trí chữ theo % chiều cao) → camera zoom vào là "đi vào" màn thiệp, không đổi vật thể.
 * Vị trí chữ khớp `.inv__head` trong InvitationScene.css.
 */
export const CARD_SIZE = { w: 760, h: 1647 } as const // = tỉ lệ ảnh giấy 852×1846
const PAPER = '/assets/invitation/paper.webp'

export async function drawInvitationCard(fullName: string, address: string) {
  const { w, h } = CARD_SIZE
  const { canvas, ctx } = makeCanvas(w, h)
  ctx.drawImage(await loadImage(PAPER), 0, 0, w, h)

  const cx = w / 2
  // cỡ chữ: fs (cqw của khung điện thoại) → px canvas theo bề ngang tờ giấy
  const px = (fs: number) => (fs / PAPER_CQW) * w
  const line = (str: string, hd: { y: number; fs: number; weight: number; spacing: number }, color: string, dx = 0) =>
    text(ctx, str, {
      font: `${hd.weight} ${px(hd.fs)}px "Cormorant Garamond"`, color, x: cx + dx, y: h * hd.y, align: 'center',
      spacing: hd.spacing * px(hd.fs), maxWidth: w * 0.9,
    })
  // "C" thư pháp + "HÂN THÀNH KÍNH MỜI"
  const K = HEAD.kicker
  ctx.save()
  ctx.font = `${K.weight} ${px(K.fs)}px "Cormorant Garamond"`
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${K.spacing * px(K.fs)}px`
  const restW = ctx.measureText('HÂN THÀNH KÍNH MỜI').width
  ctx.font = `400 ${px(K.cap)}px "Luxurious Script"`
  const capW = ctx.measureText('C').width
  ctx.restore()
  const x0 = cx - (capW + restW) / 2
  text(ctx, 'C', { font: `400 ${px(K.cap)}px "Luxurious Script"`, color: HEAD_COLOR.ink, x: x0, y: h * K.y + px(K.cap) * 0.1 })
  text(ctx, 'HÂN THÀNH KÍNH MỜI', {
    font: `${K.weight} ${px(K.fs)}px "Cormorant Garamond"`, color: HEAD_COLOR.ink, x: x0 + capW, y: h * K.y, spacing: K.spacing * px(K.fs),
  })
  line(COPY.invitationHeader.title, HEAD.title, HEAD_COLOR.ink)
  line(COPY.invitationHeader.subtitle, HEAD.subtitle, HEAD_COLOR.ink)
  line(COPY.invitationHeader.guestLabel, HEAD.label, HEAD_COLOR.gold)
  line(fullName.toLocaleUpperCase('vi'), { ...HEAD.fullName, fs: fitFs(fullName, HEAD.fullName.fs) }, HEAD_COLOR.gold)
  // "Anh/Chị + tên gọi thân mật" — chữ viết tay, khớp .inv__name
  text(ctx, address, {
    font: `400 ${px(HEAD.name.fs)}px "Luxurious Script"`, color: HEAD_COLOR.gold, x: cx, y: h * HEAD.name.y, align: 'center', maxWidth: w * 0.9,
  })

  // khung lá để TRỐNG: nội dung trang 1 (tiêu đề viết tay + lời mời) hiện dần ngay sau khi đổi vai sang thiệp DOM
  return canvas
}
