# Hệ Thống Quản Lý Sinh Viên (CRUD & MySQL & Authentication)

Dự án thực hành cơ bản quản lý sinh viên với các tính năng CRUD, cơ sở dữ liệu MySQL, và đăng nhập/đăng ký với mật khẩu được mã hóa băm bằng `bcryptjs`.

---

## 🛠️ Công Nghệ Sử Dụng

- **Backend**: Node.js & Express.
- **Cơ sở dữ liệu**: MySQL (kết nối qua thư viện `mysql2`).
- **Mã hóa mật khẩu**: `bcryptjs` (băm mật khẩu bảo mật).
- **Session**: `express-session` (quản lý phiên đăng nhập).
- **Frontend**: HTML5, CSS3 và JavaScript thuần (Fetch API).
- **Docker**: Sử dụng `docker-compose` chạy MySQL nhanh chóng.

---

## 🚀 Hướng Dẫn Cài Đặt và Chạy Dự Án

### Bước 1: Khởi động cơ sở dữ liệu MySQL (Dùng Docker)
Chạy lệnh sau tại thư mục dự án để khởi động MySQL database và giao diện quản lý cơ sở dữ liệu Adminer:
```bash
docker-compose up -d
```
*Lưu ý: Docker sẽ tự động chạy file `database.sql` để tạo bảng và nạp dữ liệu mẫu khi khởi động lần đầu.*

Nếu muốn quản lý database bằng giao diện trực quan:
- Truy cập trình duyệt: [http://localhost:8080](http://localhost:8080)
- Hệ quản trị: **MySQL**
- Máy chủ (Server): **db**
- Tài khoản: **root**
- Mật khẩu: **rootpassword**
- Cơ sở dữ liệu: **student_db**

---

### Bước 2: Cài đặt thư viện Node.js
Mở Command Prompt/Terminal và chạy lệnh:
```bash
npm install
```

---

### Bước 3: Khởi động Server
Chạy lệnh khởi động ứng dụng:
```bash
npm start
```
Ứng dụng sẽ chạy tại địa chỉ: [http://localhost:3000](http://localhost:3000)

---

## 🔑 Tài Khoản Đăng Nhập Mẫu
Hệ thống đã tự động tạo sẵn một tài khoản quản trị mặc định:
- **Tên đăng nhập**: `admin`
- **Mật khẩu**: `admin123` (được băm bằng bcrypt trong database)

Hoặc bạn có thể tự chọn nút **Đăng ký** trên giao diện để tạo tài khoản mới.

---

## 📂 Danh Sách File Quan Trọng trong Dự Án

1. `server.js` - Xử lý API đăng nhập/đăng ký, kết nối CSDL, và API CRUD sinh viên.
2. `database.sql` - Lệnh SQL tạo bảng `users` (lưu tài khoản băm) và bảng `students`.
3. `docker-compose.yml` - Tự động thiết lập MySQL và Adminer qua Docker.
4. `.env` - Cấu hình cổng kết nối, tài khoản mật khẩu database.
5. `public/` - Giao diện HTML/CSS/JS của ứng dụng.

---

## 🐙 Hướng Dẫn Đưa Lên GitHub

Mở terminal tại thư mục này và chạy các lệnh:

1. **Khởi tạo git**:
   ```bash
   git init
   ```
2. **Thêm các file**:
   ```bash
   git add .
   ```
3. **Commit code**:
   ```bash
   git commit -m "First commit: Student CRUD with MySQL and Auth"
   ```
4. **Liên kết với GitHub** (Tạo repo mới trên github.com và copy link):
   ```bash
   git branch -M main
   git remote add origin <LINK_REPO_GITHUB_CUA_BAN>
   ```
5. **Đẩy code lên**:
   ```bash
   git push -u origin main
   ```
