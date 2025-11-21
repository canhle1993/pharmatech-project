import { Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MultiSelectModule } from 'primeng/multiselect';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MessageService } from 'primeng/api';
import { AccountService } from '../../../services/account.service';
import { ProfileService } from '../../../services/profile.service';
import { Account } from '../../../entities/account.entity';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { DatePickerModule } from 'primeng/datepicker';
import { SavedJob } from '../../../entities/saved-job.entity';
import { CareerService } from '../../../services/career.service';
import { OrderService } from '../../../services/order.service';
import { Order } from '../../../entities/order.entity';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProgressSpinnerModule,
    ToastModule,
    MultiSelectModule,
    AutoCompleteModule,
    DatePickerModule,
    RouterModule,
    ConfirmDialogModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  providers: [MessageService, ConfirmationService],
})
export class ProfileComponent implements OnInit {
  account: Account | null = null;
  loading = false;
  isEditing = false;
  selectedPhoto?: File;
  selectedResume?: File;
  showOrderSuccess = false;

  /** Tabs */
  activeTab: 'info' | 'saved' | 'orders' = 'info';
  savedJobs: SavedJob[] = [];

  /** Ngày sinh min/max */
  minDate = new Date(1950, 0, 1);
  maxDate = new Date(); // hôm nay

  /** =================== Dropdown data =================== */
  genderList = ['Any', 'Male', 'Female', 'Other'];
  workTypeList = ['Full-time', 'Part-time', 'Remote', 'Hybrid'];
  educationList = ['High School', 'College', 'Bachelor', 'Master', 'PhD'];
  areaList = [
    'Hanoi',
    'Ho Chi Minh City',
    'Da Nang',
    'Hai Phong',
    'Can Tho',
    'Binh Duong',
    'Dong Nai',
    'Bac Ninh',
    'Hai Duong',
    'Hue',
    'Quang Ninh',
  ];

  fieldList = [
    { name: 'Production' },
    { name: 'Research & Development (R&D)' },
    { name: 'Quality Assurance (QA)' },
    { name: 'Quality Control (QC)' },
    { name: 'Validation & Calibration' },
    { name: 'Maintenance & Engineering' },
    { name: 'Procurement & Supply Chain' },
    { name: 'Sales & Marketing' },
    { name: 'Regulatory' },
    { name: 'Finance & Accounting' },
    { name: 'Human Resources' },
    { name: 'IT Support' },
  ];

  skillsList = [
    { name: 'GMP Compliance' },
    { name: 'Quality Control' },
    { name: 'Pharmaceutical Manufacturing' },
    { name: 'Process Validation' },
    { name: 'Equipment Maintenance' },
    { name: 'Documentation & Reporting' },
    { name: 'Research & Development (R&D)' },
    { name: 'SOP Management' },
    { name: 'Safety & Hygiene Standards' },
    { name: 'Machine Operation' },
  ];

  languageList = [
    { name: 'English' },
    { name: 'Vietnamese' },
    { name: 'Japanese' },
    { name: 'Korean' },
    { name: 'Chinese (Mandarin)' },
    { name: 'French' },
    { name: 'German' },
    { name: 'Spanish' },
    { name: 'Hindi' },
    { name: 'Thai' },
    { name: 'Other' },
  ];

  orderHistory: any[] = [];

  searchCode: string = '';
  filterStatus: string = '';
  filterApproval: string = '';
  filteredOrders: any[] = []; // toàn bộ sau khi lọc

  // ⭐ Pagination cho Order History
  pagedOrders: any[] = [];
  pageSize = 5; // mỗi trang 5 dòng
  currentPage = 1; // trang hiện tại
  totalPages = 1; // tổng số trang

  /** =================== Filtered options =================== */
  filteredGenders: string[] = [];
  filteredWorkTypes: string[] = [];
  filteredEducationLevels: string[] = [];
  filteredAreas: string[] = [];

  constructor(
    private accountService: AccountService,
    private profileService: ProfileService,
    private messageService: MessageService,
    private route: ActivatedRoute, // 👈 thêm
    private router: Router,
    private careerService: CareerService,
    private ngZone: NgZone,
    private orderService: OrderService,
    private confirmationService: ConfirmationService
  ) {}

  /** =================== Lifecycle =================== */
  async ngOnInit() {
    const id = localStorage.getItem('userId');
    this.preloadCarouselImages();

    console.log('🔍 Loaded profile userId:', id);

    if (!id || id.length !== 24) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid User',
        detail: 'Cannot load user profile.',
      });
      return;
    }

    // ⭐ ĐỌC query params
    this.route.queryParamMap.subscribe((params) => {
      const status = params.get('orderSuccess');
      const openTab = params.get('openTab'); // ⭐ tab cần mở

      // ⭐ Nếu vừa checkout → show banner thành công
      if (status === '1') {
        this.showOrderSuccess = true;

        setTimeout(() => (this.showOrderSuccess = false), 5000);
      }

      // ⭐ Nếu yêu cầu mở tab Orders
      if (openTab === 'orders') {
        this.activeTab = 'orders';
      }

      // ⭐ Xóa các query param để URL sạch sẽ
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true,
      });
    });

    this.loading = true;

    try {
      const result = await this.accountService.findById(id);
      this.account = this.profileService.normalizeAccountData(result, {
        fieldList: this.fieldList,
        skillsList: this.skillsList,
        languageList: this.languageList,
      });

      // ⭐ Load saved jobs + orders
      await this.loadSavedJobs(id);
      await this.loadOrders(id);
    } catch (err) {
      console.error('❌ Error loading profile:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load profile.',
      });
    } finally {
      this.loading = false;
    }
  }
  getStatusBadge(status: string) {
    const s = status.toLowerCase();

    switch (s) {
      case 'deposit paid':
        return 'badge bg-info text-dark';

      case 'paid in full':
        return 'badge bg-success'; // CHỈ CẦN CLASS NÀY

      case 'completed':
        return 'badge bg-success bg-opacity-75';

      case 'cancelled':
        return 'badge bg-danger';

      case 'refunded':
        return 'badge bg-primary';

      default:
        return 'badge bg-secondary';
    }
  }

  async loadOrders(userId: string) {
    try {
      const all = await this.orderService.findAll();
      const userOrders = all.filter((o: any) => {
        const cid =
          o.user_id ||
          o.customer_id ||
          o.account_id ||
          o.customer?._id ||
          o.customer?.id;

        return cid === userId;
      });

      const validOrders = userOrders.filter((o: any) => {
        return o && (o.id || o._id) && o.total_amount !== undefined;
      });

      this.orderHistory = validOrders.map((o: any) => ({
        code: o.id || o._id,
        customer: o.customer?.name || o.contact_name || 'Unknown',
        total: o.total_amount || 0,
        deposit: o.deposit_amount || 0,
        remaining:
          o.remaining_amount ?? (o.total_amount || 0) - (o.deposit_amount || 0),
        status: o.status || '—',
        approval_status: o.approval_status || '—',
        created_at: o.created_at,
      }));

      this.applyFilters(); // chạy filter + pagination

      console.log('✅ ORDER HISTORY (FE):', this.orderHistory);
    } catch (err) {
      console.error('❌ Failed to load orders:', err);
    }
  }

  applyFilters() {
    let data = [...this.orderHistory];

    if (this.searchCode.trim()) {
      const keyword = this.searchCode.toLowerCase();
      data = data.filter((o) => o.code.toLowerCase().includes(keyword));
    }

    if (this.filterStatus) {
      data = data.filter((o) => o.status === this.filterStatus);
    }

    if (this.filterApproval) {
      data = data.filter((o) => o.approval_status === this.filterApproval);
    }

    this.filteredOrders = data;

    // Tính lại tổng số trang
    this.totalPages = Math.ceil(data.length / this.pageSize);

    // Bắt đầu lại từ trang 1
    this.changePage(1);
  }

  // ======================================================
  //  ⭐ LOAD SAVED JOBS
  // ======================================================
  async loadSavedJobs(userId: string) {
    try {
      this.savedJobs = await this.careerService.getSavedJobs(userId);
      console.log('🔥 SAVED JOBS RETURNED FROM API:', this.savedJobs);

      console.log('💾 Saved jobs:', this.savedJobs);
    } catch (err) {
      console.error('❌ Failed to load saved jobs:', err);
    }
  }

  // ======================================================
  //  EDIT PROFILE
  // ======================================================
  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.selectedPhoto = file;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      if (this.account) this.account.photo = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  onResumeSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedResume = file;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      if (this.account) this.account.resume = e.target.result; // <== QUAN TRỌNG
    };
    reader.readAsDataURL(file);
  }

  async saveChanges() {
    if (!this.account) return;

    this.loading = true;
    try {
      // Upload file
      this.account = await this.profileService.uploadFiles(
        this.account,
        this.selectedPhoto,
        this.selectedResume
      );
      this.selectedPhoto = undefined;
      this.selectedResume = undefined; // <=== DÒNG QUAN TRỌNG

      // Validate
      const errorMsg = this.profileService.validateProfile(this.account);
      if (errorMsg) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Incomplete',
          detail: errorMsg,
        });
        return;
      }

      // Build payload
      const payload = this.profileService.buildPayload(this.account);
      const updated = await this.profileService.saveProfile(
        this.account,
        payload
      );
      console.log('📦 Payload gửi lên BE:', payload);

      if (updated) {
        const freshAccount = await this.accountService.findById(
          this.account._id || this.account.id
        );

        localStorage.setItem('user', JSON.stringify(freshAccount));
        localStorage.setItem('userId', freshAccount.id || freshAccount._id);

        this.account = this.profileService.normalizeAccountData(freshAccount, {
          fieldList: this.fieldList,
          skillsList: this.skillsList,
          languageList: this.languageList,
        });

        this.messageService.add({
          severity: 'success',
          summary: 'Profile Updated',
          detail: 'Your profile information has been saved successfully!',
        });
      }

      this.isEditing = false;
    } catch (err) {
      console.error('❌ Save profile error:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred while saving your profile.',
      });
    } finally {
      this.loading = false;
    }
  }

  /** =================== Filters for AutoComplete =================== */
  filterGender(event: any) {
    const q = event.query.toLowerCase();
    this.filteredGenders = this.genderList.filter((g) =>
      g.toLowerCase().includes(q)
    );
  }

  filterWorkType(event: any) {
    const q = event.query.toLowerCase();
    this.filteredWorkTypes = this.workTypeList.filter((t) =>
      t.toLowerCase().includes(q)
    );
  }

  filterEducationLevel(event: any) {
    const q = event.query.toLowerCase();
    this.filteredEducationLevels = this.educationList.filter((e) =>
      e.toLowerCase().includes(q)
    );
  }

  filterArea(event: any) {
    const q = event.query.toLowerCase();
    this.filteredAreas = this.areaList.filter((a) =>
      a.toLowerCase().includes(q)
    );
  }

  onDobChange(date: Date) {
    if (!this.account || !date) return;

    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < date.getDate())
    ) {
      age--;
    }

    (this.account as any).age = age; // ✅ chỉ gán để hiển thị FE
  }

  /* ===========================
    🚀 AVATAR GENERATOR (HF FLUX)
   =========================== */

  // Hiển thị loading carousel
  isGenerating = false;
  carouselImages = [
    'assets/carousel/3.png',
    'assets/carousel/4.png',
    'assets/carousel/5.png',
    'assets/carousel/6.png',
    'assets/carousel/8.png',
  ];
  carouselIndex = 0;
  carouselTimer: any = null;

  // Ảnh tạo xong
  generatedAvatar: string | null = null;

  // Prompt từ textarea
  avatarPrompt: string = '';

  // HuggingFace Token của anh
  HF_TOKEN = ''; // đổi lại nếu cần

  // ===============================
  // 🎡 Start Carousel
  // ===============================
  startCarousel() {
    this.carouselIndex = 0;

    if (this.carouselTimer) clearInterval(this.carouselTimer);

    // chạy ngoài Angular để smooth hơn
    this.ngZone.runOutsideAngular(() => {
      this.carouselTimer = setInterval(() => {
        this.ngZone.run(() => {
          this.carouselIndex =
            (this.carouselIndex + 1) % this.carouselImages.length;
        });
      }, 1000);
    });
  }
  preloadCarouselImages() {
    this.carouselImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }

  // ===============================
  // 🛑 Stop Carousel
  // ===============================
  stopCarousel() {
    if (this.carouselTimer) clearInterval(this.carouselTimer);
    this.carouselTimer = null;
    this.isGenerating = false;
  }

  // ===============================
  // 📌 CALL HF API — generate avatar
  // ===============================
  async generateAvatar() {
    if (!this.avatarPrompt.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing prompt',
        detail: 'Please enter a short description for your avatar.',
      });
      return;
    }

    this.isGenerating = true;
    this.generatedAvatar = null;
    this.startCarousel();

    try {
      const response = await fetch(
        'https://router.huggingface.co/nebius/v1/images/generations',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.HF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'black-forest-labs/flux-dev',
            prompt: this.avatarPrompt,
            response_format: 'b64_json',
          }),
        }
      );

      const result = await response.json();
      const b64 = result?.b64_json || result?.data?.[0]?.b64_json;

      if (!b64) throw new Error('No base64 returned from model');

      this.generatedAvatar = 'data:image/png;base64,' + b64;

      // ✔ HIỂN THỊ LÊN PROFILE CHO USER XEM TRƯỚC
      if (this.account) {
        this.account.photo = this.generatedAvatar;
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Avatar generated',
        detail: 'Preview updated — click Save to upload.',
      });
    } catch (err) {
      console.error(err);
      this.messageService.add({
        severity: 'error',
        summary: 'Generation failed',
        detail: 'Cannot generate avatar.',
      });
    } finally {
      this.stopCarousel();
    }
  }

  /* ===========================
    💾 SAVE GENERATED AVATAR
   =========================== */

  async saveGeneratedAvatar() {
    if (!this.generatedAvatar || !this.account) {
      return;
    }

    try {
      this.loading = true;

      // 🔥 BƯỚC 1 — Convert Base64 → File
      const file = await this.base64ToFile(
        this.generatedAvatar,
        'avatar_ai.png'
      );

      // 🔥 BƯỚC 2 — Gọi service upload như upload avatar thường
      const updated = await this.profileService.uploadFiles(
        this.account,
        file,
        null
      );

      // 🔥 BƯỚC 3 — Lưu vào DB
      const payload = this.profileService.buildPayload(updated);
      const saved = await this.profileService.saveProfile(updated, payload);

      if (saved) {
        this.account.photo = saved.photo;
        localStorage.setItem('currentUser', JSON.stringify(saved));

        this.messageService.add({
          severity: 'success',
          summary: 'Avatar Saved',
          detail: 'Your AI-generated avatar has been updated successfully!',
        });

        this.generatedAvatar = null; // Ẩn nút Save
      }
    } catch (err) {
      console.error('❌ Save avatar error:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save avatar.',
      });
    } finally {
      this.loading = false;
    }
  }

  /* Utility: Convert base64 → File */
  base64ToFile(base64: string, filename: string): Promise<File> {
    return fetch(base64)
      .then((res) => res.blob())
      .then((blob) => new File([blob], filename, { type: blob.type }));
  }

  /** ===============================
 * ⭐ APPLY PAGINATION
 =================================*/
  applyPagination() {
    this.totalPages = Math.ceil(this.filteredOrders.length / this.pageSize);

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    // ⭐ Quan trọng: phân trang trên filteredOrders
    this.pagedOrders = this.filteredOrders.slice(start, end);
  }

  /** ===============================
 * ⭐ ĐỔI TRANG
 =================================*/
  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;

    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;

    // ⭐ Quan trọng: phải phân trang trên filteredOrders
    this.pagedOrders = this.filteredOrders.slice(start, end);
  }

  onView(o: any) {
    const id = o.code; // dùng code làm id

    if (!id) {
      console.warn('⚠️ Order Code (ID) missing:', o);
      return;
    }

    this.router.navigate(['/profile-details', id]);
  }

  onCancelOrder(o: any) {
    if (o.approval_status === 'Pending Approval') {
      this.confirmationService.confirm({
        header: 'Cancel Order',
        message:
          'Your order has not been approved yet.<br>If you want to cancel this order, please contact the admin to process your deposit refund.',
        icon: 'pi pi-info-circle',
        acceptLabel: 'OK',
        rejectVisible: false,
        accept: () => {},
      });
    } else if (o.approval_status === 'Approved') {
      this.confirmationService.confirm({
        header: 'Cancel Order',
        message:
          'Your order has already been approved.<br>If you want to cancel, please contact the admin.<br><strong>Note:</strong> The deposit will NOT be refunded.',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'OK',
        rejectVisible: false,
        accept: () => {},
      });
    }
  }
}
