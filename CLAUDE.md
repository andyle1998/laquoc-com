# laquoc.com — Bác sĩ Chain

Web tĩnh: `index.html` + `img/`. GitHub Pages tự đưa nhánh `main` lên https://laquoc.com mỗi lần push.

## Quy trình sửa (anh Quốc chốt 2026-10-17)
1. Sửa file trong thư mục này. Không sửa artifact trên claude.ai nữa.
2. Xem trước: `python3 -m http.server 4321` → http://localhost:4321
3. Được commit để lưu bản sửa trên máy.
4. **Chỉ `git push` khi anh Quốc gọi đúng chữ "push".** "Cho lên web" trong yêu cầu viết/sửa KHÔNG phải lệnh push — vẫn dừng ở localhost chờ duyệt. Push = lên web thật ngay.

Không xóa `CNAME` (mất tên miền) hay `.nojekyll`.
