# Debug Guide: Quote Reply Error

## Lỗi hiện tại
**Error Message:** "Failed to send reply. Please try again."

## Các bước kiểm tra và sửa lỗi

### 1. Kiểm tra Backend đang chạy
```powershell
# Mở terminal tại thư mục backend
cd f:\Project_3\pharmatech-project\pharmatech-backend\PharmaTech

# Start backend server
npm run start:dev
```

**Kết quả mong đợi:**
```
[Nest] 12345  - 11/15/2025, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 11/15/2025, 10:00:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
...
[Nest] 12345  - 11/15/2025, 10:00:01 AM     LOG [NestApplication] Nest application successfully started
```

---

### 2. Kiểm tra MongoDB đang chạy
```powershell
# Kiểm tra MongoDB service
Get-Service -Name MongoDB

# Hoặc kiểm tra connection
mongosh --eval "db.runCommand({ ping: 1 })"
```

**Nếu MongoDB không chạy:**
```powershell
# Start MongoDB service
net start MongoDB

# Hoặc
Start-Service MongoDB
```

---

### 3. Kiểm tra Email Configuration

**File:** `pharmatech-backend/PharmaTech/.env`

```env
# Email config phải có đầy đủ:
mail_host=smtp.gmail.com
mail_port=465
mail_username=aplevancanh1993@gmail.com
mail_password=xiof eisi hbuj obij
mail_starttls=true
ADMIN_EMAIL=aplevancanh1993@gmail.com
```

**Lưu ý quan trọng:**
- Password phải là **App Password** của Gmail (không phải password thường)
- Gmail account phải bật 2-Step Verification
- Tạo App Password tại: https://myaccount.google.com/apppasswords

---

### 4. Test Email Service Trực tiếp

**Mở Browser Console và test API:**
```javascript
// Test endpoint send reply
fetch('http://localhost:3000/api/quote/QUOTE_ID_HERE/reply', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    replyMessage: '<p>Test reply message</p>'
  })
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

Thay `QUOTE_ID_HERE` bằng ID thật của một quote.

---

### 5. Xem Backend Console Log

Sau khi code đã được update, backend sẽ log chi tiết:

```
SendReply called with id: 67xxxxx
Quote found: user@example.com
Sending email from: aplevancanh1993@gmail.com to: user@example.com
Email sent successfully, updating status...
```

**Nếu có lỗi, log sẽ hiện:**
```
Error in sendReply: [Chi tiết lỗi]
```

---

### 6. Kiểm tra Frontend Network Tab

1. Mở DevTools (F12)
2. Vào tab **Network**
3. Click nút "Send Reply"
4. Tìm request `/api/quote/:id/reply`
5. Xem response:

**Success response:**
```json
{
  "msg": "Reply sent successfully"
}
```

**Error response:**
```json
{
  "msg": "Failed to send reply. Email service might be unavailable.",
  "error": "Chi tiết lỗi..."
}
```

---

### 7. Các lỗi thường gặp và cách fix

#### Lỗi 1: "Quote not found"
**Nguyên nhân:** ID quote không tồn tại hoặc sai format
**Giải pháp:** 
- Kiểm tra MongoDB có data không
- Verify ID format (phải là MongoDB ObjectId)

```powershell
# Kiểm tra quotes trong MongoDB
mongosh
use PharmaTech
db.quotes.find().pretty()
```

#### Lỗi 2: "Failed to send email"
**Nguyên nhân:** 
- Gmail App Password sai
- Gmail account chưa bật 2FA
- Network/firewall block port 465

**Giải pháp:**
1. Tạo lại App Password:
   - Vào https://myaccount.google.com/apppasswords
   - Chọn "Mail" và "Other (Custom name)"
   - Copy password mới vào `.env`

2. Restart backend sau khi update `.env`

#### Lỗi 3: "Connection refused"
**Nguyên nhân:** Backend không chạy hoặc chạy sai port

**Giải pháp:**
```powershell
# Kiểm tra port 3000 có process nào đang dùng
netstat -ano | findstr :3000

# Kill process nếu cần (thay PID)
taskkill /PID <PID> /F

# Start lại backend
cd f:\Project_3\pharmatech-project\pharmatech-backend\PharmaTech
npm run start:dev
```

#### Lỗi 4: CORS error
**Nguyên nhân:** Frontend và backend khác origin

**Giải pháp:** Thêm CORS trong `main.ts`:
```typescript
app.enableCors({
  origin: 'http://localhost:4200',
  credentials: true,
});
```

---

### 8. Test Email Manual

**File:** `pharmatech-backend/PharmaTech/src/mail/mail.controller.ts`

Đã có endpoint test:
```
GET http://localhost:3000/api/mail/send
```

Mở browser và truy cập URL trên. Nếu nhận được:
```json
{ "msg": "Sent" }
```
→ Email service hoạt động OK

---

### 9. Checklist Debug

- [ ] Backend đang chạy (npm run start:dev)
- [ ] MongoDB đang chạy (Get-Service MongoDB)
- [ ] .env có đầy đủ mail config
- [ ] Gmail App Password đúng
- [ ] Network tab không có CORS error
- [ ] Backend console không có error log
- [ ] Test endpoint /api/mail/send thành công

---

### 10. Restart toàn bộ hệ thống

```powershell
# Terminal 1: Backend
cd f:\Project_3\pharmatech-project\pharmatech-backend\PharmaTech
npm run start:dev

# Terminal 2: Frontend (nếu cần)
cd f:\Project_3\pharmatech-project\pharmatech-frontend\PharmaTech
ng serve
```

Sau đó test lại chức năng reply.

---

## Code đã được cập nhật

### 1. Frontend (quote.component.ts)
- ✅ Hiển thị error message chi tiết từ backend
- ✅ Better error handling với detailed logging

### 2. Backend (quote.controller.ts)
- ✅ Detailed error response
- ✅ Console logging cho debugging
- ✅ Proper HTTP status codes

### 3. Backend (quote.service.ts)
- ✅ Try-catch wrapper
- ✅ Step-by-step logging
- ✅ Better error propagation

---

## Liên hệ

Nếu vẫn gặp lỗi sau khi thử tất cả các bước trên:
1. Copy toàn bộ backend console log
2. Copy frontend Network tab response
3. Check MongoDB có data quotes không
4. Verify email config trong .env

**Lưu ý:** Password Gmail trong .env phải là **App Password** (16 ký tự), không phải password đăng nhập thường!
