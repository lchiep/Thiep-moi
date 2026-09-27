import * as THREE from 'three'
import { drawTicket, TICKET_FONTS } from '../Ticket/drawTicket'
import type { Guest } from '../../state/guestStore'
import { ticketFromGuest } from '../../state/guestStore'
import { fontsReady, makeCanvas, text } from '../../utils/paperCanvas'
import { drawInvitationCard } from './drawInvitationCard'

/**
 * Chuẩn bị toàn bộ texture cho tập tài liệu TRƯỚC khi dựng cảnh 3D
 * (đợi font + ảnh khách) để khung hình đầu tiên đã đúng, không nhảy chữ.
 */
export type FolderAssets = {
  card: THREE.CanvasTexture
  ticketMain: THREE.CanvasTexture
  ticketCopy: THREE.CanvasTexture
  cover: THREE.CanvasTexture
  ppBump: THREE.CanvasTexture
}

function tex(canvas: HTMLCanvasElement, color = true) {
  const t = new THREE.CanvasTexture(canvas)
  if (color) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  t.needsUpdate = true
  return t
}

/** Vân "vỏ cam" li ti của nhựa PP nhám — dùng làm bump map. */
function ppGrain() {
  const { canvas, ctx } = makeCanvas(512, 512)
  const img = ctx.createImageData(512, 512)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 90
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  ctx.filter = 'blur(0.6px)'
  ctx.drawImage(canvas, 0, 0)
  const t = tex(canvas, false)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(3, 3)
  return t
}

/** Mặt bìa: nhựa đen, chữ ép chìm màu bạc xám rất nhẹ. */
function coverMap() {
  const { canvas, ctx } = makeCanvas(1000, 1360)
  ctx.fillStyle = '#0f1012'
  ctx.fillRect(0, 0, 1000, 1360)
  ctx.strokeStyle = 'rgba(170,165,155,0.22)'
  ctx.lineWidth = 2
  ctx.strokeRect(70, 70, 860, 1220)
  text(ctx, 'GRADUATION GALA', { font: '600 44px "Cormorant Garamond"', color: 'rgba(196,188,172,0.5)', x: 500, y: 1150, align: 'center', spacing: 14 })
  text(ctx, 'CLASS OF 2026', { font: '600 20px Inter', color: 'rgba(196,188,172,0.38)', x: 500, y: 1200, align: 'center', spacing: 10 })
  return tex(canvas)
}

export async function buildFolderAssets(guest: Guest): Promise<FolderAssets> {
  await fontsReady([...TICKET_FONTS, '400 150px "Luxurious Script"', '600 32px "Cormorant Garamond"'])
  const t = ticketFromGuest(guest)
  const ticket = tex(await drawTicket(t))
  const card = tex(await drawInvitationCard(t.guestFullName, t.guestAddress))
  // thiệp gắn ở mặt trong bìa: sau khi bìa lật 180° hình sẽ bị ngược → xoay sẵn 180°
  card.center.set(0.5, 0.5)
  card.rotation = Math.PI
  return {
    card,
    ticketMain: ticket,
    ticketCopy: ticket, // vé thứ 2 dùng chung texture (đỡ bộ nhớ)
    cover: coverMap(),
    ppBump: ppGrain(),
  }
}

export function disposeFolderAssets(a: FolderAssets) {
  new Set(Object.values(a)).forEach((t) => t.dispose())
}
