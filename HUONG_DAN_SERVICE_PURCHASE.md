# Hướng Dẫn Quản Lý Nội Dung Service & Purchase

## Tổng Quan

Hệ thống giờ đây hỗ trợ quản lý nội dung riêng biệt cho từng trang trong Service và Purchase. Mỗi tab trên trang người dùng có một trang quản trị riêng.

## Cấu Trúc Menu Admin

### Service Pages (4 trang riêng)
- **Consulting** (`/admin/service/consulting`)
- **Technical Support** (`/admin/service/technical-support`)
- **Equipment Upgrade** (`/admin/service/equipment-upgrade`)
- **Maintenance** (`/admin/service/maintenance`)

### Purchase Pages (4 trang riêng)
- **Customer Information Intake** (`/admin/purchase/customer-intake`)
- **Technical Equipment Consulting** (`/admin/purchase/technical-consulting`)
- **URS Development** (`/admin/purchase/urs-development`)
- **Contract Signing** (`/admin/purchase/contract-signing`)

## Cách Sử Dụng

### 1. Truy Cập Admin Panel
1. Đăng nhập vào admin panel
2. Mở menu "Pages"
3. Chọn "Service" hoặc "Purchase"
4. Click vào tab con tương ứng muốn chỉnh sửa

### 2. Chỉnh Sửa Nội Dung

Mỗi trang có 2 phần chính:

#### Banner Image
- Upload ảnh banner cho trang (khuyến nghị: 1920x720 pixels)
- Mỗi trang có thể có banner riêng
- Click "Clear" để xóa ảnh đã chọn

#### Content Editor
- Sử dụng rich text editor để tạo nội dung
- Hỗ trợ:
  - Headings (H1, H2, H3)
  - Text formatting (Bold, Italic, Underline)
  - Colors và Background colors
  - Lists (Ordered, Bullet)
  - Text alignment
  - Links và Images
  - Clean formatting

### 3. Lưu Thay Đổi
- Click "Save Changes" để lưu
- Hệ thống sẽ tự động cập nhật nội dung cho tab tương ứng

## Hiển Thị Trên Trang User

### Service Page (`/services`)
- Banner hiển thị từ trang đầu tiên có banner
- 4 tabs: Consulting, Technical Support, Equipment Upgrade, Maintenance
- Mỗi tab hiển thị nội dung riêng từ trang admin tương ứng
- URL có query param: `?tab=consulting`, `?tab=technical-support`, etc.

### Purchase Page (`/purchase`)
- Banner hiển thị từ trang đầu tiên có banner
- 4 tabs: Customer Information Intake, Technical Equipment Consulting, URS Development, Contract Signing
- Mỗi tab hiển thị nội dung riêng
- URL có query param: `?tab=customer-intake`, `?tab=technical-consulting`, etc.

## Backend API

### Endpoints

#### Service
- `GET /api/service` - Lấy tất cả service pages
- `GET /api/service/:page` - Lấy content của một trang cụ thể
  - `:page` = consulting | technical-support | equipment-upgrade | maintenance
- `POST /api/service` - Tạo/cập nhật content
  - Body: FormData với fields: `page`, `content`, `images` (optional)

#### Purchase
- `GET /api/purchase` - Lấy tất cả purchase pages
- `GET /api/purchase/:page` - Lấy content của một trang cụ thể
  - `:page` = customer-intake | technical-consulting | urs-development | contract-signing
- `POST /api/purchase` - Tạo/cập nhật content
  - Body: FormData với fields: `page`, `content`, `images` (optional)

### Database Schema

```typescript
{
  page: string;        // Unique identifier (consulting, technical-support, etc.)
  bannerImage: string; // Path to banner image
  content: string;     // HTML content
  createdAt: Date;
  updatedAt: Date;
}
```

## Lưu Ý Kỹ Thuật

1. **Unique Pages**: Mỗi page identifier là unique trong database
2. **File Upload**: Banner images được lưu trong `/upload/service/` và `/upload/purchase/`
3. **Auto-save**: Nếu page chưa tồn tại, sẽ tự động tạo mới; nếu đã có, sẽ update
4. **Content Safety**: HTML content được sanitized khi hiển thị trên user pages
5. **Query Params**: Tab navigation sử dụng query params để SEO-friendly

## Troubleshooting

### Content không hiển thị
- Kiểm tra đã save content chưa
- Kiểm tra console log xem có lỗi API không
- Verify page identifier đúng (consulting, technical-support, etc.)

### Banner không hiển thị
- Kiểm tra file đã upload thành công chưa
- Verify path trong database
- Check folder `/upload/service/` hoặc `/upload/purchase/` có file không

### Menu không mở submenu
- Hard refresh browser (Ctrl + F5)
- Clear browser cache
- Kiểm tra routes đã được register đúng trong admin.routes.ts

## File Structure

```
admin/pages/
├── service-consulting/
│   ├── service-consulting.component.ts
│   ├── service-consulting.component.html
│   └── service-consulting.component.css
├── service-technical-support/
├── service-equipment-upgrade/
├── service-maintenance/
├── purchase-customer-intake/
├── purchase-technical-consulting/
├── purchase-urs-development/
└── purchase-contract-signing/
```

## Support

Nếu gặp vấn đề, kiểm tra:
1. Backend logs: Terminal chạy `nest start --watch`
2. Frontend console: F12 > Console tab
3. Network requests: F12 > Network tab
4. Database: MongoDB compass/shell để verify data
