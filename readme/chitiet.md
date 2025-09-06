# Chi Tiết Chức Năng và Cấu Trúc Dự Án "Tu Tiên Ký: Hư Vô Lộ"

## Giới thiệu

**Tu Tiên Ký: Hư Vô Lộ** là một trò chơi văn bản gia tăng (incremental/idle game) dựa trên chủ đề tu tiên. Người chơi sẽ bắt đầu từ một Phàm Nhân, thông qua việc thiền định (tự động tích lũy linh khí), đột phá cảnh giới, rèn luyện thân thể, học công pháp, luyện đan dược và tham gia vào các hoạt động khác để từng bước trở nên mạnh mẽ hơn trên con đường trường sinh. Giao diện được thiết kế hiện đại, đáp ứng linh hoạt (responsive) cho cả trải nghiệm trên máy tính và thiết bị di động.

## Các Chức Năng Chính

-   **Tu Luyện & Đột Phá:** Tự động tích lũy Linh Khí (Qi) theo thời gian. Khi đủ linh khí, người chơi có thể tiến hành đột phá lên cảnh giới cao hơn, mở khóa các tính năng và sức mạnh mới, đồng thời nhận được điểm Lĩnh Ngộ. Hệ thống có cơ chế **Phúc Lợi Thất Bại**, giúp tăng nhẹ tỷ lệ thành công cho những lần đột phá sau mỗi lần thất bại, đảm bảo người chơi không bị kẹt quá lâu.
-   **Luyện Thể & Thám Hiểm:** Sử dụng linh khí để tôi luyện thân thể, tăng cường các chỉ số chiến đấu. Gửi nhân vật đi thám hiểm các khu vực để tìm kiếm nguyên liệu (linh thảo).
-   **Công Pháp & Trang Bị:** Học và trang bị các loại công pháp và trang bị (vũ khí, giáp, phụ kiện) khác nhau để nhận được các hiệu ứng có lợi như tăng tốc độ tu luyện, tăng tỷ lệ đột phá, tăng chỉ số chiến đấu.
-   **Pháp Tướng (Avatar):** Người chơi có thể mở khóa và trang bị các loại "Pháp Tướng" (hình đại diện) khác nhau để cá nhân hóa ngoại hình của mình. Pháp Tướng có thể nhận được từ các sự kiện, giftcode, hoặc các tính năng đặc biệt khác.
-   **Luyện Đan (Alchemy):** Sử dụng linh thảo thu thập được từ Thám Hiểm để luyện chế ra các loại đan dược. Hệ thống đan dược rất linh hoạt, có thể cung cấp các hiệu ứng tức thời (như hồi phục linh khí) hoặc các **buff cường hóa tạm thời**. Các buff này có thể có **thời gian hiệu lực tính bằng giây hoặc số lần sử dụng**, và có thể có **giới hạn cộng dồn**, tạo ra chiều sâu chiến thuật cho người chơi.
-   **Lò Luyện Khí (Smelting Furnace):** Người chơi có thể phân giải các trang bị không cần thiết trong Lò Luyện Khí để nhận lại **Bụi Luyện Khí**, một loại nguyên liệu quan trọng có thể được dùng để cường hóa hoặc chế tác trang bị cao cấp hơn trong các bản cập nhật tương lai.
-   **Hệ thống Lực Chiến:**
    *   **Khái niệm:** Lực Chiến là một chỉ số tổng hợp duy nhất, đại diện cho sức mạnh toàn diện của nhân vật, được tính toán dựa trên tất cả các chỉ số (HP, Công, Thủ, Tốc Độ, Bạo Kích, v.v.) và cấp độ Cảnh Giới.
    *   **Xếp hạng:** Bảng Xếp Hạng (Thiên Địa Bảng) giờ đây sẽ sắp xếp người chơi dựa trên Lực Chiến, phản ánh chính xác hơn ai là người mạnh nhất server thay vì chỉ dựa vào cấp độ.
-   **Thí Luyện Chi Địa (PvE):** Tham gia chiến đấu với các quái vật tại các khu vực thí luyện. Khu vực được chia thành hai loại: khu vực thường để kiếm vật phẩm và khu vực **Trảm Yêu** để tích lũy Công Đức.
-   **Đấu Pháp (PvP):**
    *   **Hệ thống chiến đấu theo lượt:** Các trận PvP diễn ra tự động theo lượt dựa trên chỉ số Tốc Độ. Trận đấu kéo dài tối đa 50 lượt.
    *   **Sát Khí & Tuyệt Kỹ:** Mỗi hành động trong trận đấu sẽ tích lũy Sát Khí. Khi đủ Sát Khí, người chơi có cơ hội tung ra các Tuyệt Kỹ đã học được, với các hiệu ứng đa dạng như gây sát thương lớn, tạo khiên chắn, hoặc gây hiệu ứng xấu lên đối thủ.
    *   **Chỉ số phụ:** Hệ thống chiến đấu có chiều sâu với nhiều chỉ số phụ, bao gồm: **Bạo Kích (Crit Rate)**, **Sát Thương Bạo Kích (Crit Dmg)**, **Né Tránh (Dodge)**, **Chính Xác (Hit Rate)**, **Hút Máu (Lifesteal)**, **Phản Đòn (Counter)** và các chỉ số kháng tương ứng (**Kháng Bạo, Kháng Hút Máu, Kháng Phản Đòn**), đóng vai trò quan trọng trong việc định đoạt kết quả trận đấu.
    *   **Xem lại trận đấu:** Người chơi có thể xem lại chi tiết các trận đấu đã diễn ra thông qua một cửa sổ tái hiện diễn biến (Combat Replay).
-   **Hệ Thống Chính - Tà (Công Đức & Ác Nghiệp):**
    *   Người chơi có thể lựa chọn con đường tu luyện của riêng mình thông qua các hành động trong game, ảnh hưởng đến hai chỉ số đối lập: Công Đức (Merit) và Ác Nghiệp (Karma).
    *   **Tà Tu (Evil Path):** Tấn công và chiến thắng người chơi có cảnh giới thấp hơn sẽ tích lũy điểm **Ác Nghiệp**. Điểm Ác Nghiệp càng cao, rủi ro bị **Thiên Phạt** (có tỷ lệ bị đánh rớt 1 cảnh giới) khi đột phá càng lớn. Tuy nhiên, khi Ác Nghiệp đạt ngưỡng, người chơi sẽ nhận được hiệu ứng **tăng Công Kích**.
    *   **Chính Tu (Righteous Path):** Hoàn thành các thử thách **Trảm Yêu** đặc biệt trong Thí Luyện Chi Địa sẽ tích lũy **Công Đức**. Khi Công Đức đạt ngưỡng, người chơi sẽ nhận được hiệu ứng **tăng Sinh Lực**, đồng thời điểm Công Đức còn giúp **tăng nhẹ tỷ lệ thành công khi đột phá**.
-   **Tông Môn (Guilds):** Tạo hoặc gia nhập Tông Môn. Cống hiến cho Tông Môn để tăng cấp, mở rộng giới hạn thành viên và nhận các phúc lợi chung cho tất cả thành viên, đồng thời chuẩn bị lực lượng cho Tông Môn Chiến.
-   **Tông Môn Chiến (Guild Wars):**
    *   **Sự kiện định kỳ:** Một sự kiện tự động diễn ra theo lịch trình, nơi các tông môn đối đầu để tranh đoạt vinh quang và phần thưởng.
    *   **Ghi danh & Ghép cặp:** Trong vòng 1 giờ sau khi sự kiện bắt đầu, Tông chủ có thể ghi danh cho tông môn của mình. Sau đó, hệ thống sẽ tự động ghép cặp ngẫu nhiên các tông môn đã đăng ký.
    *   **Chiến thuật đội hình (3v3):** Các trận đấu diễn ra theo thể thức thắng 2 trên 3 vòng. Trước mỗi vòng, Tông chủ phải sắp xếp một đội hình gồm 3 thành viên. **Một thành viên chỉ có thể tham gia chiến đấu một lần duy nhất** trong toàn bộ trận đấu (match) với một tông môn khác, đòi hỏi sự tính toán chiến thuật để sử dụng nhân sự hiệu quả.
    *   **Phần thưởng:** Toàn bộ thành viên của tông môn chiến thắng sẽ nhận được những phần thưởng giá trị.
-   **Chợ Giao Dịch (Marketplace):**
    *   **Tiền tệ:** Sử dụng **Linh Thạch** làm đơn vị tiền tệ giao dịch giữa người chơi.
    *   **Rao bán:** Người chơi có thể rao bán các trang bị không sử dụng và đan dược từ túi đồ của mình với thời hạn 24 giờ.
    *   **Thuế:** Một khoản thuế 5% được áp dụng cho mỗi giao dịch thành công để duy trì sự cân bằng của nền kinh tế trong game.
-   **Lĩnh Ngộ (Insights):** Sử dụng điểm Lĩnh Ngộ nhận được khi đột phá để mở khóa các thiên phú bị động, mang lại lợi ích vĩnh viễn.
-   **Giao Diện Linh Hoạt (Responsive UI):** Giao diện được thiết kế lại hoàn toàn, tối ưu cho cả máy tính (PC) và thiết bị di động. Giao diện mới sử dụng một **thanh tác vụ (Action Bar)** duy nhất ở cuối màn hình, và tất cả các chức năng được hiển thị trong các **cửa sổ (modal)**, tạo ra một trải nghiệm sạch sẽ, tập trung và đồng nhất trên mọi thiết bị.
-   **Tính Năng Xã Hội:** Kênh chat thế giới, xem thông tin người chơi khác (Quan Sát), và bảng xếp hạng (Thiên Địa Bảng).
-   **Lưu Trữ & Offline Progress:** Toàn bộ tiến trình của người chơi được lưu trên server. Khi người chơi đăng nhập lại sau một thời gian offline, hệ thống sẽ tự động tính toán lượng tài nguyên tích lũy được (linh khí) và hoàn thành các cuộc thám hiểm trong thời gian đó.
-   **Trang Quản Trị Toàn Diện (Admin Panel):** Một giao diện web riêng biệt tại `/admin` cho phép quản trị viên (GM) quản lý toàn diện trò chơi:
    *   **Tổng Quan:** Xem các chỉ số tổng quan như tổng số người chơi, tổng số tông môn.
    *   **Quản lý Người chơi:** Tìm kiếm, xem, chỉnh sửa mọi thông số của người chơi (linh khí, cảnh giới, vật phẩm, Lực Chiến (chỉ đọc), v.v.), và thực hiện khóa/mở khóa tài khoản. Đặc biệt, khi khóa một tài khoản, hệ thống sẽ tự động **tạo một bản ghi nhanh (snapshot)** các chỉ số quan trọng của người chơi, sau đó đưa các chỉ số trong game về 0. Khi tài khoản được mở khóa, các chỉ số sẽ được **khôi phục lại từ bản ghi nhanh**, đảm bảo tính toàn vẹn và chống phá hoại.
    *   **Quản lý Tông Môn:** Xem, chỉnh sửa thông tin, và giải tán tông môn.
    *   **Quản lý Tông Môn Chiến:** Xem trạng thái cuộc chiến, các trận đấu, và có thể ép xử lý các vòng đấu nếu cần.
    *   **Quản lý Dữ liệu Game:** Toàn quyền Thêm/Sửa/Xóa (CRUD) đối với tất cả các dữ liệu nền của game: Tông Môn Chiến (tạo mới), Cảnh Giới, Phúc Lợi Thất Bại, Công Pháp, Trang Bị, Độ Hiếm, Pháp Tướng (Avatar), Tuyệt Kỹ PvP, Lời Thoại Combat, Bí Cảnh Thí Luyện, Khu Vực Thám Hiểm, Hệ thống Lĩnh Ngộ (Thiên Phú), các loại Linh Căn, vật phẩm Shop Vinh Dự, Linh Thảo, Đan Dược, và Đan Phương.
    *   **Quản lý Chợ & Sự kiện:** Quản lý các vật phẩm đang được rao bán trên cả hai loại chợ, tạo và quản lý các sự kiện và mã quà tặng trong game.

## Cấu Trúc Thư Mục Dự Án

Dự án được tổ chức thành các module riêng biệt, giúp cho việc phát triển và bảo trì trở nên dễ dàng hơn. Dưới đây là mô tả chi tiết về cấu trúc các thư mục chính:

### Tổng quan

Dự án bao gồm 5 thành phần chính:
-   **`/server`**: Backend của ứng dụng, xử lý logic game, API và quản lý cơ sở dữ liệu.
-   **`/client`**: Giao diện người dùng cho người chơi (game client).
-   **`/admin`**: Giao diện quản trị dành cho Game Master (GM).
-   **`/sql`**: Chứa các script để khởi tạo và cập nhật schema cho cơ sở dữ liệu.
-   **`/readme`**: Chứa các tài liệu hướng dẫn và mô tả về dự án.

### Chi tiết các thư mục

#### 1. Thư mục `/server` (Backend)

Sử dụng Node.js và Express.js để xây dựng API cho game.

-   **`config/`**: Chứa file cấu hình kết nối đến cơ sở dữ liệu MariaDB (`database.js`).
-   **`middleware/`**: Chứa các middleware, điển hình là `auth.js` để xác thực người dùng và admin thông qua JSON Web Tokens (JWT).
-   **`routes/`**: Định nghĩa các API endpoints. Mỗi file tương ứng với một nhóm chức năng:
    -   `admin.routes.js`: API cho trang quản trị.
    -   `auth.routes.js`: API đăng ký, đăng nhập.
    -   `player.routes.js`: API xử lý thông tin, hành động của người chơi.
    -   `guild.routes.js`: API quản lý Tông Môn.
    -   `market.routes.js`: API cho Chợ Giao Dịch.
    -   `pvp.routes.js`: API cho hệ thống Đấu Pháp.
    -   `chat.routes.js`: API cho kênh chat.
    -   ... và các file khác.
-   **`services/`**: Nơi chứa logic nghiệp vụ cốt lõi của game. Tách biệt logic khỏi các route handlers:
    -   `gameData.service.js`: Quản lý việc tải và cache (lưu đệm) dữ liệu game tĩnh từ database.
    -   `player.service.js`: Xử lý các hành động phức tạp của người chơi như tính toán offline, tính toán chỉ số, v.v.
    -   `guildWar.service.js`: Xử lý logic của Tông Môn Chiến.
-   **`utils/`**: Chứa các hàm tiện ích nhỏ, tái sử dụng được như `formatters.js`.
-   **`index.js`**: File khởi động server, thiết lập middleware và các routes.

#### 2. Thư mục `/client` (Game Client)

Xây dựng bằng React và Vite, là giao diện chính mà người chơi tương tác.

-   **`components/`**: Tập hợp các component React, được chia nhỏ theo từng chức năng (panel):
    -   `AlchemyPanel.tsx`, `GuildPanel.tsx`, `PvpPanel.tsx`, v.v.: Mỗi file là một cửa sổ (modal) chức năng riêng biệt.
    -   `Header.tsx`, `GameLog.tsx`, `ChatPanel.tsx`: Các thành phần giao diện chính.
-   **`config/`**: Chứa file `config.ts` để định nghĩa `API_BASE_URL`.
-   **`constants.ts`**: Chứa các hằng số, hàm tính toán và định dạng phía client để hiển thị dữ liệu một cách nhất quán.
-   **`types.ts`**: Định nghĩa các kiểu dữ liệu TypeScript cho toàn bộ client.
-   **`App.tsx`**: Component gốc của ứng dụng, quản lý trạng thái chính, các modal và luồng dữ liệu.
-   **`index.html`, `index.tsx`**: Điểm bắt đầu của ứng dụng React.

#### 3. Thư mục `/admin` (Admin Panel)

Cũng được xây dựng bằng React và Vite, cung cấp giao diện web cho quản trị viên.

-   **`components/`**: Các component React phục vụ cho trang quản trị:
    -   `dashboard/AdminDashboard.tsx`: Bảng điều khiển chính sau khi đăng nhập.
    -   `data/DataManager.tsx`: Một component linh hoạt, có thể tái sử dụng để quản lý (CRUD) bất kỳ bảng dữ liệu nào trong game.
    -   `players/PlayerManager.tsx`: Giao diện chuyên biệt để quản lý người chơi.
    -   `ui/`: Các component giao diện cơ bản như `Button`, `Input`, `Modal`.
-   **`config/`, `types.ts`**: Tương tự như của client nhưng dành riêng cho admin.
-   **`App.tsx`**: Component gốc, xử lý logic đăng nhập và hiển thị dashboard.
-   **`index.html`, `index.tsx`**: Điểm bắt đầu của ứng dụng admin.

#### 4. Thư mục `/sql`

Chứa các file `.md` với nội dung là mã SQL. Các file được đặt tên theo thứ tự để thực thi:
-   `01_schema_core.md`: Tạo schema cho các bảng dữ liệu game cốt lõi (Cảnh giới, Trang bị, v.v.).
-   `02_schema_player.md`: Tạo schema cho các bảng liên quan đến người chơi và hệ thống (Người chơi, Tông Môn, Chợ, v.v.).
-   `03_schema_guild_war.md`: Tạo schema cho tính năng Tông Môn Chiến.
-   `04_schema_alterations.md`: Các lệnh `ALTER TABLE` để cập nhật cấu trúc bảng đã có.
-   `05_data_population.md`: Chèn dữ liệu game mặc định vào các bảng.

#### 5. Thư mục `/readme`

Chứa tài liệu của dự án.
-   **`chitiet.md`**: (Chính là file này) Mô tả chi tiết các tính năng của game và cấu trúc dự án.
-   **`huongdan.md`**: Hướng dẫn chi tiết cách cài đặt và triển khai dự án trên máy chủ cũng như môi trường local.
