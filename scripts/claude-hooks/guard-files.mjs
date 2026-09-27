#!/usr/bin/env node
/**
 * PreToolUse (Read/Edit/Write/MultiEdit): chặn đụng vào file bí mật / file không được sửa.
 */
import { readInput, block, norm } from './_io.mjs'

const { tool_name: tool, tool_input: input = {} } = await readInput()
const file = norm(input.file_path || input.notebook_path || '')
if (!file) process.exit(0)
const name = file.split('/').pop()

// 1. file env thật: không đọc, không sửa (chỉ .env.example là được)
if (/^\.env(\..+)?$/.test(name) && name !== '.env.example')
  block(`⛔ Không được ${tool === 'Read' ? 'đọc' : 'sửa'} ${name}: file chứa khoá thật. Cần biến mới thì thêm vào .env.example (giá trị mẫu) và nhờ Hiệp tự điền.`)

if (tool === 'Read') process.exit(0)

// 2. ảnh gốc Hiệp tạo: chỉ đọc
if (/\/assets-src\//.test(file)) block('⛔ assets-src/ là ảnh gốc của Hiệp — không sửa/ghi đè. Ảnh đã xử lý để ở public/assets/.')

// 3. ảnh gốc so sánh của test: chỉ cập nhật bằng lệnh, sau khi Hiệp duyệt giao diện
if (/\/tests\/__screenshots__\//.test(file))
  block('⛔ Ảnh gốc test không sửa tay. Hiệp duyệt giao diện mới xong thì chạy: npm run test:e2e:update')

// 4. package-lock sửa bằng npm, không sửa tay
if (name === 'package-lock.json') block('⛔ Không sửa tay package-lock.json — dùng npm install/uninstall.')

process.exit(0)
