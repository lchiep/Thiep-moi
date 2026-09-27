#!/usr/bin/env node
/**
 * check-rules — máy kiểm tra LUẬT RIÊNG của dự án thiệp mời.
 *
 * Biến các quy tắc trong CLAUDE.md thành lỗi thật, để người hay AI sửa code
 * lỡ quên luật thì `npm run verify` / CI / hook của Claude Code sẽ báo ngay.
 *
 *   node scripts/check-rules.mjs            → quét toàn bộ src/
 *   node scripts/check-rules.mjs a.tsx b.ts → chỉ quét các file này (hook dùng)
 *
 * ERROR  = vi phạm luật cứng → thoát mã 1 (verify/CI đỏ).
 * WARN   = đáng xem lại, không chặn.
 * Bỏ qua 1 dòng có lý do: thêm chú thích `rules-ok: <lý do>` ngay trên dòng đó hoặc cuối dòng.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')
const CODE = /\.(tsx?|mjs|js|css)$/

/* ---------------------------------------------------------------- luật ---- */
/** @type {{id:string, level:'error'|'warn', why:string, files?:RegExp, skip?:RegExp, test:(line:string, ctx:{file:string, text:string})=>boolean}[]} */
const LINE_RULES = [
  {
    id: 'no-settimeout',
    level: 'error',
    why: 'Không dùng setTimeout cho hiệu ứng — dùng GSAP timeline (label, onComplete, delayedCall) và kill khi unmount.',
    files: /\.(tsx?|mjs|js)$/,
    test: (l) => /\bsetTimeout\s*\(/.test(l),
  },
  {
    id: 'no-banned-libs',
    level: 'error',
    why: 'Stack đã chốt: KHÔNG Tailwind, shadcn, framer-motion hay UI kit (MUI, antd, Chakra…). CSS viết tay theo token.',
    files: /\.(tsx?|mjs|js|css)$/,
    test: (l) =>
      /(from|import)\s*\(?\s*['"](framer-motion|motion\/react|tailwindcss|@tailwind[^'"]*|@shadcn[^'"]*|@mui\/[^'"]*|antd|@chakra-ui\/[^'"]*|@radix-ui\/[^'"]*)['"]/.test(l) ||
      /@tailwind\s+(base|components|utilities)/.test(l),
  },
  {
    id: 'no-forbidden-motifs',
    level: 'error',
    why: 'Tuyệt đối không: đóng dấu / "BẠN ĐƯỢC DUYỆT", máy bay giấy (nhánh Nữ), neon.',
    files: /\.(tsx?|css)$/,
    // chỉ bắt chữ/tên đang được DÙNG, không bắt câu chú thích nhắc "không dùng …"
    test: (l) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(l)) return false
      return /BẠN ĐƯỢC DUYỆT|ĐƯỢC DUYỆT|APPROVED|paper-?airplane|paperPlane|máy bay giấy|stampHand|approvalStamp|\bneon\b/i.test(l)
    },
  },
  {
    id: 'no-secret-keys',
    level: 'error',
    why: 'Frontend chỉ được dùng khoá publishable của Supabase. service_role / sb_secret_ không bao giờ nằm trong code.',
    test: (l) => /service_role|sb_secret_|SUPABASE_SERVICE/i.test(l) && !/^\s*(\/\/|\*|\/\*)/.test(l),
  },
  {
    id: 'no-setstate-per-frame',
    level: 'error',
    why: 'React không cập nhật mỗi frame — không gọi setState trong onUpdate của GSAP / useFrame. Ghi thẳng vào DOM/ref.',
    files: /\.(tsx?)$/,
    test: (l) => /(onUpdate|useFrame)\s*[:(][^\n]*\bset[A-Z]\w*\(/.test(l),
  },
  {
    id: 'no-layout-tween',
    level: 'warn',
    why: 'Tween top/left/width/height/margin gây layout mỗi frame → dùng x/y/scale/clip-path. (gsap.set một lần thì được.)',
    files: /\.(tsx?)$/,
    test: (l) => /gsap\.(to|from|fromTo)\([^\n]*[{,]\s*(top|left|right|bottom|width|height|margin\w*)\s*:/.test(l) ||
      /\.(to|from|fromTo)\([^\n]*[{,]\s*(top|left|width|height|margin\w*)\s*:\s*['"\d]/.test(l) && /tl|timeline/i.test(l),
  },
  {
    id: 'phone-units',
    level: 'warn',
    why: 'Trong khung điện thoại dùng cqw/cqh (container .app__phone), không dùng vw/vh/dvh.',
    files: /\.(css|tsx)$/,
    skip: /(styles[\\/](tokens|global)\.css|design-preview\.css|DesignPreview\.tsx)$/,
    test: (l) => /(?<![\w-])\d*\.?\d+(vw|vh|dvh|svh|lvh)\b/.test(l),
  },
  {
    id: 'no-scaleX-folder',
    level: 'error',
    why: 'Mở tập hồ sơ/thiệp phải xoay quanh gáy (rotateY + transform-origin / 3D), không làm giả bằng scaleX.',
    files: /(DocumentFolder|ZFold|Envelope|maleDocument|femaleEnvelope)[^\\/]*\.(tsx?)$|(DocumentFolder|ZFoldInvitation|Envelope)[\\/]/,
    test: (l) => /scaleX\s*:\s*(0(\.\d+)?|['"]0)/.test(l),
  },
]

/** Luật theo cả file (cần nhìn toàn bộ nội dung). */
const FILE_RULES = [
  {
    id: 'raf-cleanup',
    level: 'warn',
    why: 'Có requestAnimationFrame lặp mà không thấy cancelAnimationFrame → dễ rò khi unmount.',
    test: ({ text }) => (text.match(/requestAnimationFrame\(/g) || []).length > 1 && !/cancelAnimationFrame\(/.test(text),
  },
  {
    id: 'interval-cleanup',
    level: 'error',
    why: 'setInterval phải có clearInterval trong cùng file (cleanup khi unmount).',
    test: ({ text }) => /setInterval\(/.test(text) && !/clearInterval\(/.test(text),
  },
  {
    id: 'anime-cleanup',
    level: 'warn',
    why: 'File dùng Anime.js trong component nhưng không thấy revert()/pause()/cancel() → nhớ dọn khi unmount.',
    test: ({ file, text }) =>
      /\.tsx$/.test(file) && /from ['"]animejs['"]/.test(text) && /useEffect|useLayoutEffect/.test(text) && !/\.(revert|pause|cancel)\(/.test(text),
  },
]

/* ------------------------------------------------------------ quét file ---- */
const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : CODE.test(n) ? [p] : []
  })

const args = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const files = (args.length ? args.map((a) => join(ROOT, a)) : walk(SRC)).filter(
  (f) => existsSync(f) && CODE.test(f) && relative(ROOT, f).split(sep)[0] === 'src',
)

const found = []
const allowed = (lines, i) => /rules-ok/.test(lines[i]) || (i > 0 && /rules-ok/.test(lines[i - 1]))

for (const file of files) {
  const rel = relative(ROOT, file).split(sep).join('/')
  const text = readFileSync(file, 'utf8')
  const lines = text.split(/\r?\n/)
  for (const r of LINE_RULES) {
    if (r.files && !r.files.test(rel)) continue
    if (r.skip && r.skip.test(rel)) continue
    lines.forEach((l, i) => {
      if (r.test(l, { file: rel, text }) && !allowed(lines, i)) found.push({ ...r, file: rel, line: i + 1, src: l.trim() })
    })
  }
  for (const r of FILE_RULES) {
    if (r.test({ file: rel, text }) && !/rules-ok:\s*/.test(text.split('\n')[0])) found.push({ ...r, file: rel, line: 1, src: '' })
  }
}

/* --------------------------------------------- luật cấp repo (chỉ khi quét hết) */
if (!args.length) {
  try {
    const tracked = execSync('git ls-files', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n')
    for (const t of tracked) {
      if (/(^|\/)\.env(\.[\w-]+)?\.local$|(^|\/)\.env$/.test(t))
        found.push({ id: 'no-env-committed', level: 'error', why: 'File .env thật đã bị đưa vào git — xoá khỏi git (git rm --cached) ngay.', file: t, line: 1, src: '' })
    }
  } catch { /* không có git → bỏ qua */ }
}

/* ---------------------------------------------------------------- in ra ---- */
const errors = found.filter((f) => f.level === 'error')
const warns = found.filter((f) => f.level === 'warn')
const red = (s) => `\x1b[31m${s}\x1b[0m`, yel = (s) => `\x1b[33m${s}\x1b[0m`, dim = (s) => `\x1b[2m${s}\x1b[0m`

const byRule = (list, paint) => {
  const groups = new Map()
  for (const f of list) groups.set(f.id, [...(groups.get(f.id) || []), f])
  for (const [id, items] of groups) {
    console.log(paint(`\n✖ [${id}] `) + items[0].why)
    for (const f of items) console.log(`   ${f.file}:${f.line}${f.src ? dim('  ' + f.src.slice(0, 110)) : ''}`)
  }
}
byRule(errors, red)
if (!process.argv.includes('--quiet-warn')) byRule(warns, yel)

console.log(
  `\ncheck:rules — ${files.length} file · ` +
    (errors.length ? red(`${errors.length} lỗi`) : '0 lỗi') + ' · ' +
    (warns.length ? yel(`${warns.length} cảnh báo`) : '0 cảnh báo'),
)
process.exit(errors.length ? 1 : 0)
