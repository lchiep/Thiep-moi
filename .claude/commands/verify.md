---
description: Kiểm tra tổng (TypeScript + luật dự án + build) và báo kết quả bằng tiếng Việt
---
Chạy `npm run verify` trong thư mục dự án.

- Nếu XANH: báo Hiệp 1 dòng "verify xanh" + số cảnh báo (nếu có) của check:rules.
- Nếu ĐỎ: đọc lỗi, sửa tận gốc (không tắt luật, không thêm `rules-ok` chỉ để qua), chạy lại tới khi xanh, rồi tóm tắt ngắn đã sửa gì.
