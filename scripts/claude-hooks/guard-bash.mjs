#!/usr/bin/env node
/**
 * PreToolUse (Bash): chặn lệnh nguy hiểm hoặc trái luật dự án trước khi chạy.
 */
import { readInput, block } from './_io.mjs'

const { tool_input: input = {} } = await readInput()
const cmd = String(input.command || '')

const RULES = [
  [/\bgit\s+push\b[^\n]*(--force|-f\b)/, 'Không force-push. Muốn sửa lịch sử thì hỏi Hiệp trước.'],
  [/\bgit\s+(reset\s+--hard|clean\s+-[a-z]*f)/, 'Lệnh xoá thay đổi chưa commit — hỏi Hiệp trước.'],
  [/\brm\s+-[a-z]*r[a-z]*f?\s+(\/|~|\.\s*$|\*|src\b|public\b|assets-src\b)/, 'Không xoá cả thư mục dự án/ảnh gốc.'],
  [/(cat|type|more|less|head|tail|Get-Content)\s+[^\n]*\.env(\.local|\.production)?\b(?!\.example)/, 'Không in nội dung file env thật.'],
  [/git\s+add\s+[^\n]*\.env(?!\.example)/, 'Không đưa file .env thật vào git.'],
  [/npm\s+(i|install|add)\b[^\n]*\b(framer-motion|motion|tailwindcss|@tailwindcss\/\S+|shadcn|@mui\/\S+|antd|@chakra-ui\/\S+|styled-components)\b/,
    'Thư viện này bị cấm trong dự án (không Tailwind/shadcn/framer-motion/UI kit). Dùng GSAP/Anime.js + CSS theo token.'],
  [/--update-snapshots|test:e2e:update/, 'Cập nhật ảnh gốc test = chấp nhận giao diện mới. Chỉ làm khi Hiệp đã xem và đồng ý — hỏi Hiệp trước.'],
]
for (const [re, why] of RULES) if (re.test(cmd)) block(`⛔ Lệnh bị chặn: ${why}\n   Lệnh: ${cmd.slice(0, 160)}`)
process.exit(0)
