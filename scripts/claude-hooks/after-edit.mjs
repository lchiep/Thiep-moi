#!/usr/bin/env node
/**
 * PostToolUse (Edit/Write/MultiEdit): vừa sửa file trong src/ → quét luật dự án ngay trên file đó.
 * Vi phạm → thoát mã 2, Claude thấy lỗi và sửa luôn trong lượt này.
 * (Kiểm tra TypeScript cả dự án để ở hook Stop cho nhanh.)
 */
import { spawnSync } from 'node:child_process'
import { relative } from 'node:path'
import { readInput, block, norm } from './_io.mjs'

const { tool_input: input = {} } = await readInput()
const root = process.env.CLAUDE_PROJECT_DIR || process.cwd()
const rel = norm(relative(root, input.file_path || ''))
if (!/^src\/.+\.(tsx?|css|mjs|js)$/.test(rel)) process.exit(0)

const r = spawnSync(process.execPath, ['scripts/check-rules.mjs', rel, '--quiet-warn'], { cwd: root, encoding: 'utf8' })
if (r.status !== 0) block(`check:rules báo lỗi trong ${rel} — sửa ngay:\n${(r.stdout + r.stderr).replace(/\x1b\[[0-9;]*m/g, '')}`)
process.exit(0)
