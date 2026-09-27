# Prompt tạo asset: Gemini / ChatGPT

> Dùng cho Phase 3 đến 12. Mỗi mục ghi rõ: **ảnh gốc cần upload**, **prompt để copy**, **tên file cần lưu** và **thư mục**.
> Prompt viết bằng tiếng Anh vì model ảnh hiểu tiếng Anh chính xác hơn.

## Quy tắc chung (đọc trước)

1. **Luôn dùng chế độ SỬA ẢNH, không tạo ảnh mới.** Upload đúng ảnh gốc được ghi trong từng mục, rồi dán prompt vào. Như vậy góc chụp, ánh sáng và màu sẽ giữ y hệt ảnh gốc. Nếu tạo ảnh mới từ đầu thì chắc chắn bị lệch.
2. **Nên dùng lại đúng AI đã tạo ra ảnh gốc.** Ảnh nào tạo bằng Gemini thì sửa bằng Gemini, ảnh nào tạo bằng ChatGPT thì sửa bằng ChatGPT.
3. **Tỉ lệ khung 9:16 (dọc)** cho mọi ảnh nền. Tải về ở độ phân giải cao nhất AI cho phép.
4. **Kiểm tra ảnh trước khi gửi mình:**
   - Góc chụp và vị trí đồ vật khớp với ảnh gốc: bật tắt qua lại giữa 2 ảnh, đồ vật không bị "nhảy" chỗ.
   - Không có chữ, logo hay icon lạ.
   - Dấu ✦ watermark của Gemini ở góc phải dưới không cần lo, mình tự xoá được.
5. **Chỉ copy phần tiếng Anh trong khung prompt**, không copy tiêu đề, dòng "Upload/Lưu thành" hay chữ tiếng Việt. Nếu dán cả phần đó, Gemini sẽ báo lỗi "không có quyền truy cập nội dung".
6. **Tải ảnh bằng nút Download (bản gốc)**, không chụp màn hình hoặc copy ảnh xem trước (bản xem trước chỉ khoảng 572×1024, mờ trên điện thoại).
7. Gửi ảnh vào chat. Mình sẽ nén sang WebP, cắt lớp và đặt vào `public/assets/`.

---

## A. Màn cuộc gọi: nền sạch (BẮT BUỘC)

**Ảnh gốc cần upload:** ảnh màn khoá (MacBook + mũ tốt nghiệp, có chữ "Graduation Gala" và thanh "slide to answer").
**Lưu thành:** `backgrounds/call-scene.webp`

```
Edit this image. Remove ALL user-interface elements and text: the status bar (time, signal, wifi, battery), the "CUỘC GỌI ĐẾN" pill, the "Graduation Gala" title, the subtitle, the "Remind Me" and "Message" round icons with their labels, the green "slide to answer" bar, and the small sparkle in the bottom-right corner.
Fill those areas naturally with the same dark bedsheet fabric, folds, shadows and warm window light that surround them.
Keep EVERYTHING else pixel-identical: the MacBook, the graduation cap, the red tassel, the camera angle, framing, colors, grain and lighting. Do not add any new object. Portrait 9:16.
```

---

## B. Nhánh Nam: nền sạch, không có tập tài liệu (BẮT BUỘC)

**Ảnh gốc cần upload:** ảnh MacBook + mũ + tập tài liệu đen có thiệp và vé.
**Lưu thành:** `backgrounds/male-document-scene.webp`

```
Edit this image. Completely remove the black document folder, the invitation card, the metal clips and all the tickets from the lower half of the picture.
Replace that area with the same dark bedsheet fabric and soft folds, continuing the warm light and leaf shadows naturally, so the bed looks empty in the lower half.
Keep the MacBook, the graduation cap, the red tassel, the camera angle, colors, grain and lighting exactly the same. Do not add any object or text.
Then extend the canvas to a portrait 9:16 frame by continuing the dark bedsheet above and below (outpainting), keeping the laptop and cap in the upper third.
```

---

## B2. Nhánh Nam: tập tài liệu (2 ảnh, BẮT BUỘC)

Chụp thẳng từ trên xuống, nền xám trơn. Mình sẽ tách nền và dùng làm các mặt của folder 3D (bìa lật quanh gáy). Không để giấy/vé bên trong: thiệp và vé mình vẽ bằng code.

### F1. Folder đóng
**Upload:** (tuỳ chọn) ảnh nhánh Nam gốc để tham khảo.
**Lưu thành:** `male/folder-closed.png`
```
Create a photorealistic top-down product photo of a closed premium A4 document presentation folder, like the black folder in the reference image. Dark charcoal black, textured hard cardboard with a soft-touch leatherette finish, slightly rounded corners, visible thickness and a subtle spine on the left edge. No logo, no text, no clips visible on the outside.
Camera exactly straight above (orthographic, no perspective), the folder perfectly centered and fully visible with some margin. Plain flat light grey background (#D9D9D9), soft even warm light from the upper left, only a very soft contact shadow. Portrait 3:4.
```

### F2. Folder mở
**Upload:** ảnh **F1** vừa tạo.
**Lưu thành:** `male/folder-open.png`
```
Using the folder in this image, show the SAME folder fully opened flat, viewed exactly from straight above. Left panel: the inside of the front cover, dark charcoal lining with one small silver metal clip at the top center, holding nothing. Right panel: the inside back cover with a diagonal pocket flap in the lower half, empty. The spine is in the exact center. No papers, no tickets, no cards, no text anywhere.
Same material, same color, same lighting as the reference, camera orthographic with no perspective, plain flat light grey background (#D9D9D9), only a very soft contact shadow. Landscape 3:2.
```

---

## C. Nhánh Nữ: cảnh tulip tách 3 lớp (BẮT BUỘC)

Mục này tạo **3 ảnh từ cùng một ảnh gốc**: bỏ dần từng vật đi. Mình sẽ so sánh 3 ảnh với nhau để tự tách ra bó hoa, KitKat và cánh hoa thành các lớp riêng. Nhờ vậy các vật có thể lần lượt bay vào và đung đưa, mà ánh sáng giữa các lớp vẫn khớp hoàn hảo.

**Ảnh gốc cần upload:** ảnh tulip + phong bì **đang đóng** + KitKat.

### C1. Bỏ phong bì
**Lưu thành:** `female/flower-scene-full.webp`
```
Edit this image. Remove the cream envelope and its burgundy wax seal completely. Where the envelope was, show what would naturally be underneath: the continuation of the pink tulip stems and petals on the left, and the cream silk fabric and white marble on the right, with the same soft window light and shadows.
Keep the tulips, silk, marble, KitKat, chocolate pieces and petals exactly the same position, color and lighting. Portrait 9:16. No new objects, no text.
```

### C2. Bỏ phong bì + bó hoa
**Upload:** ảnh **C1** vừa tạo.
**Lưu thành:** `female/flower-scene-no-bouquet.webp`
```
Edit this image. Remove the entire pink tulip bouquet (all flowers, stems and leaves). Show the cream silk fabric and the white marble surface underneath, with the same soft folds, window light and shadows continuing naturally.
Keep the KitKat, the chocolate pieces and the loose petals exactly the same. Portrait 9:16. No new objects, no text.
```

### C3. Chỉ còn lụa + marble
**Upload:** ảnh **C2** vừa tạo.
**Lưu thành:** `female/flower-scene-plate.webp`
```
Edit this image. Remove the KitKat bar, the broken chocolate pieces, the crumbs and every loose petal. Keep only the cream silk fabric and the white marble surface with the same window light and soft shadows. Portrait 9:16. No objects, no text.
```

---

## D. Không cần tạo (mình tự làm bằng code)

- **Vé**: vẽ bằng code theo đúng mẫu vé Hiệp gửi, để tên, ảnh và mã vé của khách hiện chính xác.
- **Tấm thiệp** (giấy ngà, chữ, hoạ tiết lá vàng): vẽ bằng code, font thư pháp **Imperial Script**.
- **Popup kính mờ, icon, thanh trượt, thanh trạng thái (giờ, pin)**: làm bằng code.
- **Bóng lá cửa sổ trên popup**: làm bằng code.
- **Chất liệu giấy ngà, bìa tập tài liệu, nền đỏ đô**: tạo bằng code (noise + vân giấy), đúng mã màu đã đo từ ảnh mẫu.
- **Dấu sáp đỏ đô chữ "H"**: dựng 3D bằng code (có sáp bóng, mép chảy không đều, chữ H dập nổi).

---

## Thứ tự nên làm

1. **A** và **C1 → C2 → C3**: cần sớm nhất (Phase 3 và Phase 8).
2. **B**: cho Phase 7.
