# laquoc.com — Bác sĩ Chain

Web tĩnh: `index.html` + `img/`. GitHub Pages tự đưa nhánh `main` lên https://laquoc.com mỗi lần push.

## Quy trình sửa (anh Quốc chốt 2026-10-17)
1. Sửa file trong thư mục này. Không sửa artifact trên claude.ai nữa.
2. Xem trước: `python3 -m http.server 4321` → http://localhost:4321
3. Được commit để lưu bản sửa trên máy.
4. **Chỉ `git push` khi anh Quốc gọi đúng chữ "push".** "Cho lên web" trong yêu cầu viết/sửa KHÔNG phải lệnh push — vẫn dừng ở localhost chờ duyệt. Push = lên web thật ngay.

Không xóa `CNAME` (mất tên miền) hay `.nojekyll`.

## Xem trước khi gửi link
- Thêm/sửa bài viết hoặc sản phẩm Lab → chạy `node bin/tao-chia-se.mjs` trước khi commit (sinh ảnh `og/`, trang `bai/<id>/`, `lab/<id>/`, thẻ meta trang chủ).
- Link để gửi đi: `laquoc.com/bai/<id>/`, `laquoc.com/lab/<id>/` — không gửi link dạng `/#...` (Facebook/Zalo không đọc phần sau `#`).

## Thống kê truy cập (tab Quản trị — /#quan-tri, không có trên menu)
- Kho: Supabase dự án `laquoc-com` (mzqngrbbmlsuzlvrbzjl). Cấu trúc: `supabase/thong-ke.sql`.
- Trang ghi ẩn danh vào `su_kien` bằng khóa công khai; chỉ email trong bảng `quan_tri` (đã xác nhận) mới gọi được `bao_cao`.
- Lượt xem từ localhost ghi `may='localhost'`, báo cáo mặc định chỉ tính `laquoc.com`.

## Giải Hold'em — chơi với bạn bè
- Phòng riêng mã 6 ký tự, kết nối qua Supabase Realtime (kênh `pk-<mã>`, dự án `laquoc-com`), không lưu gì vào bảng.
- Máy chủ phòng chạy luật và chia bài; bài tẩy mã hóa ECDH P-256 + AES-GCM cho từng người. Hết 30 giây không đánh → tự xem/bỏ.
- PO đã chọn làm dù có rủi ro pháp lý (Nghị định 147/2024/NĐ-CP về trò chơi G1) — 2026-10-18. Lời miễn trừ "chỉ để giải trí, nghiêm cấm đánh bạc" phải luôn đứng đầu hướng dẫn và sảnh giải.

## Hỏi đáp (/#hoi-dap) — dữ liệu người hỏi
- Bảng `cau_hoi`: khách chỉ được gửi; câu công khai chỉ hiện khi anh Quốc đã trả lời (tab Quản trị → Câu hỏi).
- `lien_he` của câu hỏi riêng là dữ liệu cá nhân: chỉ quản trị đọc, không bao giờ đưa ra trang công khai, không xuất đi đâu.
