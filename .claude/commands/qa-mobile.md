---
description: Chạy test tự động + so ảnh giao diện ở 4 cỡ điện thoại, rồi nhờ agent mobile-qa soi lỗi
argument-hint: "[tên test hoặc cỡ màn, vd: 390x844 | Nam | popup]"
---
Kiểm tra giao diện mobile của thiệp.

1. Chạy `npm run verify`. Đỏ thì sửa trước.
2. Chạy test Playwright:
   - Không có tham số: `npx playwright test`
   - Tham số là cỡ màn (vd `390x844`): `npx playwright test --project=$ARGUMENTS`
   - Tham số khác: `npx playwright test -g "$ARGUMENTS"`
3. Nếu test so ảnh báo khác: mở `tests/.results/**/` xem 3 ảnh `-expected / -actual / -diff`, rồi giao cho sub-agent **mobile-qa** đọc các ảnh đó và trả lời: khác ở đâu, là LỖI (chữ đè, tràn khung, lệch, vé trôi, dải tối…) hay là THAY ĐỔI CÓ CHỦ ĐÍCH.
4. Báo Hiệp bằng tiếng Việt, ngắn: test nào qua/hỏng, lỗi thật là gì, đề xuất sửa.
   - Lỗi thật → sửa rồi chạy lại.
   - Thay đổi có chủ đích → KHÔNG tự cập nhật ảnh gốc. Hỏi Hiệp; Hiệp đồng ý thì Hiệp chạy `npm run test:e2e:update` (hook đã chặn Claude tự chạy lệnh này).
