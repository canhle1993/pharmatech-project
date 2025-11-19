import { Component, OnInit } from '@angular/core';
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

import { DatePickerModule } from 'primeng/datepicker';
import { SavedJob } from '../../../entities/saved-job.entity';
import { CareerService } from '../../../services/career.service';

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
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  providers: [MessageService],
})
export class ProfileComponent implements OnInit {
  account: Account | null = null;
  loading = false;
  isEditing = false;
  selectedPhoto?: File;
  selectedResume?: File;
  showOrderSuccess = false;

  /** Tabs */
  activeTab: 'info' | 'saved' = 'info';
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
    private careerService: CareerService // ⭐ Dùng CareerService
  ) {}

  /** =================== Lifecycle =================== */
  async ngOnInit() {
    const id = localStorage.getItem('userId');

    console.log('🔍 Loaded profile userId:', id);

    if (!id || id.length !== 24) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid User',
        detail: 'Cannot load user profile.',
      });
      return;
    }

    // 👇 ĐỌC query param orderSuccess
    this.route.queryParamMap.subscribe((params) => {
      const status = params.get('orderSuccess');
      if (status === '1') {
        this.showOrderSuccess = true;

        // Optional: xoá param khỏi URL cho sạch
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { orderSuccess: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });

        // Optional: tự tắt sau 5 giây
        setTimeout(() => (this.showOrderSuccess = false), 5000);
      }
    });

    this.loading = true;

    try {
      const result = await this.accountService.findById(id);
      this.account = this.profileService.normalizeAccountData(result, {
        fieldList: this.fieldList,
        skillsList: this.skillsList,
        languageList: this.languageList,
      });

      // ⭐ Load saved jobs
      await this.loadSavedJobs(id);
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
    'https://picsum.photos/id/1015/80/80',
    'https://picsum.photos/id/1025/80/80',
    'https://picsum.photos/id/1035/80/80',
    'https://picsum.photos/id/1041/80/80',
    'https://picsum.photos/id/1050/80/80',
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

    this.carouselTimer = setInterval(() => {
      this.carouselIndex =
        (this.carouselIndex + 1) % this.carouselImages.length;
    }, 900);
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
}
