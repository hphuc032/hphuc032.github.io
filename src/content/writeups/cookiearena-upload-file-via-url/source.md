# ctf-writeups
Write-ups and notes for Capture The Flag (CTF) challenges
## 🧩 Challenge: Upload File via URL - [10] - Web

### 📜 Mô tả đề:
> Bạn có thể dễ dàng tải lên và hiển thị các tệp từ URL. Ứng dụng web thân thiện với người dùng này sử dụng Python, Flask và Bootstrap, giúp bạn dễ dàng chuyển các tệp từ web đến bộ nhớ cục bộ của mình và xem chúng.

>Nhập URL tệp bạn muốn tải lên vào trường được cung cấp.
Nhấp vào nút "Tải lên".
Trang web sẽ lấy tệp, lưu trữ an toàn và hiển thị để bạn thuận tiện theo dõi.

### 📁 File đính kèm:
- http://103.97.125.56:32288/upload

### 🎯 Mục tiêu:
> Mục tiêu của bài là tìm ra flag từ `/flag.txt` or `/flag`

---

### 🔍 Phân tích đề:
- Bài này là 1 bài về lỗ hỏng SSRF của cookie arena 
- Nhìn source code sẽ đọc thấy rằng nó không có kiểm tra đầu vào url

---

### 🔧 Khai thác:
- vì nó không kiểm tra link url nên ta sẽ nhập 1 url nó có bắt phải là ip của challenge nên ta sẽ có pay load như sau:
`http://localhost:1337/flag` 
sau khi nhập vào
![image](https://hackmd.io/_uploads/HJMbdNMHgx.png)
nhấn upload nó sẽ ra cái 1 ảnh ta lưu ảnh đó về máy rồi bằng notepad 
:::success
CHH{Ea5y_SSRF_UpL0ad_F1l3_uRL_c63ebf4d9e747205ebe3cd1677737b93}
:::
