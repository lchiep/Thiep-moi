import smartcrop from 'smartcrop'
import { loadImage } from './image'

/**
 * Tìm "điểm quan trọng" của ảnh (thường là khuôn mặt) để khung ảnh trên vé cắt đúng chỗ,
 * thay vì luôn lấy giữa ảnh. Trả về tâm vùng cần giữ, toạ độ 0–1.
 *  1. FaceDetector có sẵn trong trình duyệt (Chrome Android…) → lấy đúng khuôn mặt lớn nhất.
 *  2. Không có → smartcrop.js (nhẹ, chạy trên máy): chấm điểm vùng nhiều chi tiết/da người
 *     cho khung dọc cùng tỉ lệ với khung ảnh trên vé.
 *  Lỗi gì cũng trả về giữa-lệch-trên (0.5, 0.35).
 */
export type Focus = { x: number; y: number }
const FALLBACK: Focus = { x: 0.5, y: 0.35 }

type FD = { detect: (i: CanvasImageSource) => Promise<{ boundingBox: DOMRectReadOnly }[]> }
type FDCtor = new (o?: { fastMode?: boolean; maxDetectedFaces?: number }) => FD

export async function findFocus(src: string, frameAspect = 368 / 451): Promise<Focus> {
  try {
    const img = await loadImage(src)
    const W = img.naturalWidth
    const H = img.naturalHeight

    const Ctor = (window as unknown as { FaceDetector?: FDCtor }).FaceDetector
    if (Ctor) {
      try {
        const faces = await new Ctor({ fastMode: true, maxDetectedFaces: 5 }).detect(img)
        if (faces.length) {
          const f = faces.sort((a, b) => b.boundingBox.width * b.boundingBox.height - a.boundingBox.width * a.boundingBox.height)[0].boundingBox
          // giữ cả tóc + cằm: tâm hơi cao hơn tâm khuôn mặt
          return { x: (f.x + f.width / 2) / W, y: (f.y + f.height * 0.45) / H }
        }
      } catch {
        /* dùng smartcrop */
      }
    }

    // khung dọc lớn nhất vừa ảnh, cùng tỉ lệ khung ảnh trên vé
    let cw = W
    let ch = W / frameAspect
    if (ch > H) {
      ch = H
      cw = H * frameAspect
    }
    const { topCrop: c } = await smartcrop.crop(img, { width: Math.round(cw), height: Math.round(ch), minScale: 0.85 })
    return { x: (c.x + c.width / 2) / W, y: (c.y + c.height * 0.42) / H }
  } catch {
    return FALLBACK
  }
}
