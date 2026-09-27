/** Đọc JSON Claude Code gửi vào hook qua stdin. */
export async function readInput() {
  let raw = ''
  for await (const c of process.stdin) raw += c
  try { return JSON.parse(raw || '{}') } catch { return {} }
}
/** Chặn hành động: in lý do ra stderr + thoát mã 2 (Claude Code đọc lý do và tự sửa). */
export function block(msg) {
  process.stderr.write(msg.trim() + '\n')
  process.exit(2)
}
export const norm = (p = '') => String(p).replace(/\\/g, '/')
