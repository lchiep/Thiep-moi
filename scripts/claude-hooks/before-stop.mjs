#!/usr/bin/env node
/**
 * Stop: trước khi Claude báo "xong", nếu có sửa code thì bắt chạy typecheck + check:rules.
 * Hỏng → thoát mã 2: Claude không được dừng, phải sửa cho xanh.
 * Không sửa code (chỉ trò chuyện) → cho dừng luôn.
 */
import { spawnSync } from 'node:child_process'
import { readInput, block } from './_io.mjs'

const input = await readInput()
if (input.stop_hook_active) process.exit(0) // đã chặn 1 lần trong lượt này → không lặp vô hạn

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd()
const sh = (cmd, args) => spawnSync(cmd, args, { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' })

const changed = sh('git', ['status', '--porcelain', '--', 'src', 'tests', 'scripts', 'index.html', 'vite.config.ts', 'package.json']).stdout.trim()
if (!changed) process.exit(0)

const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '')
const tsc = sh('npx', ['tsc', '-b', '--noEmit'])
if (tsc.status !== 0) block(`TypeScript còn lỗi — sửa trước khi báo xong:\n${strip(tsc.stdout + tsc.stderr).slice(-3000)}`)

const rules = sh(process.execPath, ['scripts/check-rules.mjs', '--quiet-warn'])
if (rules.status !== 0) block(`check:rules còn lỗi — sửa trước khi báo xong:\n${strip(rules.stdout + rules.stderr).slice(-3000)}`)

// giao diện có đổi → nhắc (không chặn) chạy test so ảnh
if (/\.(css|tsx)$/m.test(changed.split('\n').map((l) => l.slice(3)).join('\n')))
  process.stdout.write('Gợi ý: có sửa giao diện → nên chạy /qa-mobile (npm run test:e2e) trước khi đưa Hiệp xem.\n')
process.exit(0)
