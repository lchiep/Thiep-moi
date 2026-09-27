# Harness — bộ kiểm tra tự động quanh dự án

Mục tiêu: mỗi lần (người hoặc Claude) sửa code, máy **tự kiểm**, **tự chặn lỗi đã biết**, **tự phát hiện vỡ giao diện** —
thay vì Hiệp phải soi bằng mắt.

```
 sửa code ──► hook sau khi sửa ──► check:rules (file vừa sửa)
     │
     ├─► trước khi Claude báo xong ──► typecheck + check:rules   (đỏ → chưa được dừng)
     ├─► /qa-mobile ──► Playwright chạy luồng thật + so ảnh 4 cỡ màn ──► agent mobile-qa soi ảnh khác
     └─► git push ──► GitHub Actions: verify + Playwright (Linux)
```

## 1. Luật dự án — `npm run check:rules`
File: `scripts/check-rules.mjs`. Quét `src/`, báo **lỗi** (chặn) hoặc **cảnh báo** (không chặn):

| Luật | Mức | Bắt gì |
|---|---|---|
| no-settimeout | lỗi | `setTimeout(` trong code → dùng GSAP timeline |
| no-banned-libs | lỗi | import framer-motion, Tailwind, shadcn, MUI, antd, Chakra, Radix |
| no-forbidden-motifs | lỗi | "BẠN ĐƯỢC DUYỆT", máy bay giấy, đóng dấu, neon (bỏ qua dòng chú thích) |
| no-secret-keys | lỗi | `service_role`, `sb_secret_` |
| no-setstate-per-frame | lỗi | setState trong `onUpdate` / `useFrame` |
| interval-cleanup | lỗi | `setInterval` mà không có `clearInterval` |
| no-scaleX-folder | lỗi | mở tập/phong bì/Z-fold bằng `scaleX: 0` |
| no-env-committed | lỗi | file `.env` / `.env.local` bị đưa vào git |
| no-layout-tween | cảnh báo | tween `top/left/width/height/margin` |
| phone-units | cảnh báo | `vw/vh/dvh` trong CSS cảnh (ngoài tokens/global) |
| raf-cleanup, anime-cleanup | cảnh báo | rAF lặp / Anime.js không thấy dọn dẹp |

Có lý do chính đáng để phá luật ở 1 dòng → thêm chú thích `// rules-ok: <lý do>` trên dòng đó.
Thêm luật mới: thêm 1 mục vào `LINE_RULES` hoặc `FILE_RULES`.

## 2. Kiểm tra tổng — `npm run verify`
`typecheck` → `check:rules` → `vite build`. Phải xanh trước khi báo xong / trước khi push.

## 3. Test giao diện — Playwright
File: `playwright.config.ts`, `tests/e2e/*.spec.ts`.

- Chạy **dev server** (có dữ liệu mẫu), mở `/?qa`, làm như người thật: **vuốt** nghe máy, **up ảnh** (`tests/fixtures/guest-photo.jpg` — ảnh minh hoạ tự vẽ, không phải ảnh thật), GỬI, chạm vé/thiệp, vuốt xuống cất vé, vuốt phải sang thiệp, cuộn 5 trang, ← Quay lại, kéo bản đồ + nút ◎.
- Ở mỗi mốc: chờ đúng trạng thái (`<html data-exp="...">`) rồi **chụp ảnh và so với ảnh gốc** ở 4 cỡ màn 375×812, 390×844, 393×873, 430×932.
- Bắt được lỗi cũ: ảnh `10-folder-open` được so **3 lần** (lúc đầu, sau khi cất vé, sau khi Quay lại) → vé trôi lên là test đỏ.
- Vùng luôn chuyển động (bụi nắng, bản đồ, số đếm ngược, mũ lơ lửng) được che khi so.
- Mọi lỗi JavaScript trên trang → test đỏ.

Lệnh:
```bash
npm run test:e2e                         # chạy hết (4 cỡ màn)
npx playwright test --project=390x844    # 1 cỡ màn
npx playwright test -g "Nam"             # theo tên test
npm run test:e2e:report                  # xem báo cáo: ảnh gốc / ảnh mới / chỗ khác (tô đỏ)
npm run test:e2e:ui                      # chế độ giao diện, xem từng bước
npm run test:e2e:update                  # CHỤP LẠI ảnh gốc — chỉ khi đã duyệt giao diện mới
```
Ảnh gốc lưu theo hệ điều hành: `tests/__screenshots__/win32/…` (máy Hiệp) và `…/linux/…` (CI), vì font mỗi máy vẽ hơi khác.

Móc kiểm thử (chỉ có khi URL có `?qa`): `<html data-exp>`, `window.__send(event)`, `window.__maleTargets()` (toạ độ thiệp / túi vé trên màn), `window.__maleEnter/__maleOpen/...` (timeline).

## 4. Hook của Claude Code — `.claude/settings.json`
Script trong `scripts/claude-hooks/`:

| Hook | Script | Làm gì |
|---|---|---|
| Trước Read/Edit/Write | `guard-files.mjs` | Chặn đọc/sửa `.env*` thật; chặn sửa `assets-src/`, ảnh gốc test, `package-lock.json` |
| Trước Bash | `guard-bash.mjs` | Chặn force-push, `reset --hard`, xoá thư mục dự án, in file env, cài thư viện bị cấm, **tự cập nhật ảnh gốc test** |
| Sau Edit/Write | `after-edit.mjs` | Chạy check:rules trên file vừa sửa → lỗi thì Claude sửa ngay |
| Stop | `before-stop.mjs` | Có sửa code → typecheck + check:rules phải xanh mới được dừng |

## 5. Lệnh tắt — `.claude/commands/`
| Lệnh | Việc |
|---|---|
| `/verify` | Chạy verify, đỏ thì sửa tới xanh |
| `/qa-mobile [cỡ màn \| tên test]` | Test Playwright + agent **mobile-qa** soi ảnh khác |
| `/review-motion [file \| cảnh]` | Agent **gsap-motion** + **invitation-reviewer** soát hiệu ứng |
| `/copy` | Agent **copy-vi** soát chữ tiếng Việt |
| `/new-scene <tên>` | Khung làm cảnh mới: state → timeline → test → tài liệu |

## 6. GitHub Actions — `.github/workflows/ci.yml`
Mỗi lần push lên `main` / mở PR: job **verify** → job **e2e** (Playwright trên Linux, 4 cỡ màn). Báo cáo tải về ở tab Actions → lần chạy → Artifacts → `playwright-report`.
Chụp lại ảnh gốc Linux: Actions → CI → **Run workflow** → tick `cap_nhat_anh_goc` → bot tự commit ảnh mới.

## Duyệt thay đổi giao diện (quy trình)
1. Sửa giao diện → `npm run test:e2e` đỏ ở bước so ảnh (đúng như mong đợi).
2. `npm run test:e2e:report` → xem ảnh mới. Ưng → `npm run test:e2e:update` → commit ảnh gốc mới.
3. Push → trên GitHub chạy "Run workflow" với `cap_nhat_anh_goc` để cập nhật ảnh gốc Linux.
