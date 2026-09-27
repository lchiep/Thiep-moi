/**
 * Nén ảnh khách chọn: thu cạnh dài về `max` px, xuất JPEG.
 * Ảnh đã nén đủ nhỏ (~40–80KB) để giữ trong bộ nhớ + localStorage cho vé.
 */
export async function compressImage(file: File, max = 600, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file).catch(() => null)
  const src: CanvasImageSource & { width: number; height: number } =
    bitmap ?? (await loadImage(URL.createObjectURL(file)))
  const scale = Math.min(1, max / Math.max(src.width, src.height))
  const w = Math.round(src.width * scale)
  const h = Math.round(src.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(src, 0, 0, w, h)
  bitmap?.close()
  return canvas.toDataURL('image/jpeg', quality)
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}
