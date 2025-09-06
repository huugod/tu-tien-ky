# Hướng Dẫn Cài Đặt và Chạy Game "Tu Tiên Ký: Hư Vô Lộ"

Tài liệu này cung cấp hai bộ hướng dẫn:
1.  **Triển khai lên máy chủ VPS Ubuntu (Production):** Dành cho việc đưa game lên môi trường online, sử dụng Nginx, PM2, và các công cụ chuyên nghiệp.
2.  **Chạy trên máy local (Development):** Dành cho việc phát triển và thử nghiệm trên máy tính cá nhân.

---

## I. Hướng Dẫn Triển Khai Lên VPS Ubuntu (Production)

Phần này hướng dẫn bạn cách triển khai toàn bộ ứng dụng (Backend, Game Client, Admin Panel) lên một máy chủ ảo (VPS) chạy hệ điều hành Ubuntu.

### Yêu Cầu
*   Một VPS chạy Ubuntu 20.04 hoặc mới hơn.
*   Một tên miền (domain) đã trỏ về địa chỉ IP của VPS.
*   Quyền truy cập `sudo`.

### Bước 1: Cài Đặt Môi Trường Cơ Bản

1.  **Cập nhật hệ thống:**
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

2.  **Cài đặt các công cụ cần thiết:**
    *   **Nginx (Web Server):**
        ```bash
        sudo apt install nginx -y
        ```
    *   **MariaDB (Database):**
        ```bash
        sudo apt install mariadb-server -y
        ```
    *   **Node.js (thông qua nvm):**
        ```bash
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
        # Tải lại shell để sử dụng nvm
        source ~/.bashrc
        # Cài đặt Node.js phiên bản 18
        nvm install 18
        nvm use 18
        ```
    *   **PM2 (Process Manager):**
        ```bash
        npm install pm2 -g
        ```

### Bước 2: Cấu Hình Database

1.  **Bảo mật MariaDB:** Chạy script bảo mật và làm theo các hướng dẫn (đặt mật khẩu root, xóa user ẩn danh, etc.).
    ```bash
    sudo mysql_secure_installation
    ```

2.  **Tạo Database và User:**
    ```bash
    sudo mysql -u root -p
    ```
    Bên trong MariaDB shell, chạy các lệnh sau (thay `your_password` bằng một mật khẩu mạnh):
    ```sql
    CREATE DATABASE tu_tien_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    CREATE USER 'tu_tien_user'@'localhost' IDENTIFIED BY 'your_password';
    GRANT ALL PRIVILEGES ON tu_tien_db.* TO 'tu_tien_user'@'localhost';
    FLUSH PRIVILEGES;
    EXIT;
    ```

3.  **Nhập Schema và Dữ liệu:** Tải mã nguồn của bạn lên server. Sau đó, chạy lệnh sau để nhập toàn bộ các file SQL theo đúng thứ tự.
    ```bash
    # Ví dụ: Giả sử mã nguồn của bạn ở /var/www/tu-tien-ky
    # Lệnh 'cat' sẽ nối tất cả các file .md trong thư mục sql theo thứ tự tên file
    # và đưa vào mysql để thực thi.
    cat /var/www/tu-tien-ky/sql/*.md | sudo mysql -u tu_tien_user -p tu_tien_db
    ```

4.  **Tạo tài khoản Admin đầu tiên:** Để đăng nhập vào trang quản trị, hãy chạy lệnh SQL sau. Lệnh này tạo tài khoản `admin` với mật khẩu là `123456`.
    ```bash
    sudo mysql -u root -p tu_tien_db -e "INSERT INTO admins (username, password) VALUES ('admin', '$2a$10$toE5KdTvU0p9BJpLzqhSbu8cK/srrZQkldLNXRD5X6cDbmct3x0BK');"
    ```

### Bước 3: Tải và Cài Đặt Dependencies

1.  **Tải mã nguồn:** Di chuyển đến thư mục bạn muốn chứa dự án (ví dụ `/var/www/`) và clone repository (hoặc tải lên qua FTP/SCP).
    ```bash
    # Ví dụ
    sudo mkdir -p /var/www
    sudo chown $USER:$USER /var/www
    cd /var/www
    git clone <your-git-repo-url> tu-tien-ky
    cd tu-tien-ky
    ```

2.  **Cài đặt dependencies:**
    *   **Game Client (Thư mục gốc):**
        ```bash
        npm install
        ```
    *   **Backend:**
        ```bash
        cd server
        npm install
        cd .. 
        ```
    *   **Admin Panel:**
        ```bash
        cd admin
        npm install
        ```

### Bước 4: Cấu Hình Ứng Dụng Backend (Quan trọng)

Đây là bước cực kỳ quan trọng để đảm bảo ứng dụng kết nối đúng database và bảo mật. Các file cần chỉnh sửa đều nằm trong thư mục `server/`.

1.  **Cấu hình kết nối Database:**
    *   Mở file: `server/config/database.js`
    *   Chỉnh sửa các giá trị `user` và `password` để khớp với thông tin bạn đã tạo ở **Bước 2**.
    ```javascript
    const pool = mariadb.createPool({
        host: 'localhost', 
        port: 3306,
        user: 'tu_tien_user', // <-- THAY ĐỔI
        password: 'your_password', // <-- THAY ĐỔI
        database: 'tu_tien_db',
        // ... các cấu hình khác
    });
    ```

2.  **Cấu hình Bảo mật (JWT Secret):**
    *   Mở file: `server/middleware/auth.js`
    *   **CẢNH BÁO:** Bắt buộc phải thay đổi `JWT_SECRET`. Sử dụng một chuỗi ký tự ngẫu nhiên và phức tạp.
    *   Bạn có thể tạo một key mạnh bằng lệnh sau trên terminal của VPS: `openssl rand -base64 32`
    *   Copy chuỗi kết quả và dán vào file.
    ```javascript
    // Ví dụ sau khi thay đổi:
    const JWT_SECRET = 'dGhpcyBpcyBhIHZlcnkgc3Ryb25nIGFuZCBzZWNyZXQga2V5Cg=='; // <-- THAY ĐỔI
    ```

### Bước 5: Build Giao Diện

1.  **Build Game Client:**
     ```bash
    npm run build
    ```
    Lệnh này sẽ tạo thư mục `dist` ở thư mục gốc.

2.  **Build Admin Panel:**
    ```bash
    cd admin
    npm run build
    ```
    Lệnh này sẽ tạo ra một thư mục `dist` bên trong `admin/`.

### Bước 6: Cấu Hình Nginx làm Reverse Proxy

1.  **Tạo file cấu hình Nginx mới:**
    ```bash
    sudo nano /etc/nginx/sites-available/tu-tien-ky
    ```

2.  **Dán nội dung sau vào file, thay `your_domain.com` bằng tên miền của bạn:**
    ```nginx
    server {
        listen 80;
        server_name your_domain.com; # THAY ĐỔI TÊN MIỀN

        # Phục vụ Game Client (build từ thư mục gốc)
        root /var/www/tu-tien-ky/dist;
        index index.html;

        location / {
            try_files $uri /index.html;
        }

        # Phục vụ Admin Panel
        location /admin {
            alias /var/www/tu-tien-ky/admin/dist;
            try_files $uri /admin/index.html;
        }

        # API backend
        location /api/ {
            proxy_pass http://127.0.0.1:3001; # Backend Node.js chạy ở port 3001
            # === IMPORTANT HEADERS FOR IP DETECTION ===
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Real-IP $remote_addr;
            # ========================================
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

3.  **Kích hoạt cấu hình và kiểm tra lỗi:**
    ```bash
    # Tạo symbolic link để kích hoạt site
    sudo ln -s /etc/nginx/sites-available/tu-tien-ky /etc/nginx/sites-enabled/
    
    # Xóa link default nếu có
    sudo rm /etc/nginx/sites-enabled/default
    
    # Kiểm tra cú pháp Nginx
    sudo nginx -t
    
    # Khởi động lại Nginx
    sudo systemctl restart nginx
    ```

### Bước 7: Cấu Hình Tường Lửa (UFW)

```bash
sudo ufw allow 'OpenSSH'
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Bước 8: Chạy Backend với PM2

1.  **Khởi động server backend:** Từ thư mục gốc của dự án (`/var/www/tu-tien-ky`), chạy lệnh:
    ```bash
    pm2 start server/index.js --name "tu-tien-ky-backend"
    ```

2.  **Lưu lại danh sách process để tự khởi động lại khi reboot:**
    ```bash
    pm2 save
    ```

3.  **Kiểm tra trạng thái và logs:**
    *   Xem danh sách process: `pm2 list`
    *   Xem log của backend: `pm2 logs tu-tien-ky-backend`

### Bước 9 (Khuyến khích): Cài Đặt SSL với Certbot

Để trang web của bạn an toàn với HTTPS.
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your_domain.com
```
Làm theo các hướng dẫn để nhận chứng chỉ và tự động cấu hình Nginx.

**Chúc mừng!** Ứng dụng của bạn giờ đã hoạt động tại `https://your_domain.com` và trang quản trị tại `https://your_domain.com/admin`.

---

## II. Hướng Dẫn Chạy trên Môi Trường Development (Local)

Phần này dành cho việc phát triển và thử nghiệm trên máy tính cá nhân. Bạn sẽ cần **mở 3 cửa sổ Terminal (hoặc Command Prompt/PowerShell) riêng biệt** và giữ chúng chạy đồng thời.

### Yêu Cầu
1.  **Node.js**: Phiên bản 18.x trở lên.
2.  **MariaDB (hoặc MySQL)**: Một instance database đang chạy.
3.  **npm** (hoặc yarn, pnpm).

### Bước 1: Chuẩn Bị Database
*   **Tạo Database:** Tạo một database rỗng với tên `tu_tien_db` và collation `utf8mb4_unicode_ci`.
*   **Nhập Dữ Liệu:** Sử dụng một công cụ quản lý DB (như DBeaver, DataGrip, hoặc command line) để chạy toàn bộ nội dung của các file trong thư mục `sql/` trên database vừa tạo. Hãy đảm bảo chạy theo đúng thứ tự tên file (01, 02, 03, 04, 05).
*   **Tạo Tài Khoản Admin:** Để đăng nhập vào trang quản trị, hãy chạy lệnh SQL sau. Lệnh này tạo tài khoản `admin` với mật khẩu là `123456`.
    ```sql
    INSERT INTO admins (username, password) VALUES ('admin', '$2a$10$toE5KdTvU0p9BJpLzqhSbu8cK/srrZQkldLNXRD5X6cDbmct3x0BK');
    ```

### Bước 2: Chạy các thành phần của dự án

Mở 3 cửa sổ Terminal khác nhau.

---
**Terminal 1: Backend Server**

1.  **Di chuyển vào thư mục `server`:**
    ```bash
    cd server
    ```
2.  **Cài đặt dependencies:**
    ```bash
    npm install
    ```
3.  **Cấu hình kết nối Database:**
    *   Mở file `server/config/database.js`.
    *   Chỉnh sửa các thông tin `user`, `password`, `database`, `host` cho phù hợp với môi trường local của bạn.
4.  **Khởi động Server:**
    ```bash
    npm start
    ```
    *   Server sẽ chạy tại `http://localhost:3001`.
    *   **Giữ cửa sổ terminal này mở.**

---
**Terminal 2: Game Client**

1.  **Di chuyển về thư mục gốc của dự án.** (Nếu bạn đang ở trong `server`, dùng `cd ..`)
2.  **Cài đặt dependencies:**
    ```bash
    npm install
    ```
3.  **Khởi động server phát triển:**
    ```bash
    npm run dev
    ```
    *   Game client sẽ có thể truy cập tại `http://localhost:3000`.
    *   **Giữ cửa sổ terminal này mở.**

---
**Terminal 3: Trang Quản Trị (Admin Panel)**

1.  **Di chuyển vào thư mục `admin`:** (Từ thư mục gốc, chạy `cd admin`)
    ```bash
    cd admin
    ```
2.  **Cài đặt dependencies:**
    ```bash
    npm install
    ```
3.  **Khởi động server phát triển:**
    ```bash
    npm run dev
    ```
    *   Admin panel sẽ có thể truy cập tại `http://localhost:3002`.
    *   **Giữ cửa sổ terminal này mở.**

---
### Tổng Kết
*   **Game:** `http://localhost:3000`
*   **Backend API:** `http://localhost:3001`
*   **Admin Panel:** `http://localhost:3002`

Bạn đã sẵn sàng để phát triển và thử nghiệm!