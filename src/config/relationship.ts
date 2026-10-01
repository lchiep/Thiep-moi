/**
 * Ô "Relationship" trong popup (thay cho CCCD) → quyết định XƯNG HÔ trong thư, tờ nhắn và dòng tên trên thiệp/vé.
 *  - guest: đại từ gọi khách ({g} trong chữ thư)   - self: đại từ Hiệp tự xưng ({s} trong chữ thư)
 *  - title: chữ đứng trước biệt danh ở dòng tên ("Anh Tý", "Chú Hùng"); `alone` = chỉ ghi chữ đó, không kèm tên (Bố / Mẹ);
 *    null = theo giới tính như cũ (Anh/Chị + biệt danh)
 * Thêm/sửa quan hệ: chỉ sửa danh sách dưới đây.
 */
export type Relationship = 'anh' | 'chi' | 'em_trai' | 'em_gai' | 'bo' | 'me' | 'chu' | 'di' | 'bac' | 'ban'

type Rel = { value: Relationship; label: string; guest: string; self: string; title: string | null; alone?: boolean }

export const RELATIONSHIPS: readonly Rel[] = [
  { value: 'anh', label: 'Anh', guest: 'anh', self: 'em', title: 'Anh' },
  { value: 'chi', label: 'Chị', guest: 'chị', self: 'em', title: 'Chị' },
  { value: 'em_trai', label: 'Em trai', guest: 'em', self: 'anh', title: 'Em' },
  { value: 'em_gai', label: 'Em gái', guest: 'em', self: 'anh', title: 'Em' },
  { value: 'bo', label: 'Bố', guest: 'bố', self: 'con', title: 'Bố', alone: true },
  { value: 'me', label: 'Mẹ', guest: 'mẹ', self: 'con', title: 'Mẹ', alone: true },
  { value: 'chu', label: 'Chú', guest: 'chú', self: 'cháu', title: 'Chú' },
  { value: 'di', label: 'Dì', guest: 'dì', self: 'cháu', title: 'Dì' },
  { value: 'bac', label: 'Bác', guest: 'bác', self: 'cháu', title: 'Bác' },
  { value: 'ban', label: 'Bạn bè', guest: 'bạn', self: 'mình', title: null },
]

/** Khách cũ (lưu trước khi có ô này) / giá trị lạ → coi là bạn bè: xưng "bạn – mình" như thư ban đầu. */
export const relOf = (v: string | null | undefined): Rel => RELATIONSHIPS.find((r) => r.value === v) ?? RELATIONSHIPS[RELATIONSHIPS.length - 1]

const cap = (s: string) => s.charAt(0).toLocaleUpperCase('vi') + s.slice(1)

/**
 * Thay mã xưng hô trong chữ: {g} / {G} = đại từ gọi khách (thường / viết hoa đầu câu), {s} / {S} = Hiệp tự xưng.
 * Vd. "{S} rất mong {g} đến" → Bố: "Con rất mong bố đến" · Anh: "Em rất mong anh đến" · Bạn bè: "Mình rất mong bạn đến".
 */
export function fillPronouns(text: string, v: string | null | undefined) {
  const r = relOf(v)
  return text.replaceAll('{g}', r.guest).replaceAll('{G}', cap(r.guest)).replaceAll('{s}', r.self).replaceAll('{S}', cap(r.self))
}

/** Áp fillPronouns cho mọi chuỗi trong 1 object/mảng (chữ thư nhiều tầng). */
export function fillDeep<T>(x: T, v: string | null | undefined): T {
  if (typeof x === 'string') return fillPronouns(x, v) as T
  if (Array.isArray(x)) return x.map((i) => fillDeep(i, v)) as T
  if (x && typeof x === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(x)) out[k] = fillDeep(val, v)
    return out as T
  }
  return x
}
