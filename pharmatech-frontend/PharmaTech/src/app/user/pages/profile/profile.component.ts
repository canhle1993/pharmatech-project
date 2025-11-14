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

  /** ✅ Giới hạn ngày sinh */
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
    private router: Router
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

  /** =================== Actions =================== */
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
        // ✅ Cập nhật lại localStorage để applyJob đọc dữ liệu mới nhất
        localStorage.setItem('currentUser', JSON.stringify(updated));
        localStorage.setItem('userId', updated._id);

        // ✅ Normalize lại dữ liệu vừa cập nhật để hiển thị đẹp
        this.account = this.profileService.normalizeAccountData(updated, {
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
    const query = event.query.toLowerCase();
    this.filteredGenders = this.genderList.filter((g) =>
      g.toLowerCase().includes(query)
    );
  }

  filterWorkType(event: any) {
    const query = event.query.toLowerCase();
    this.filteredWorkTypes = this.workTypeList.filter((t) =>
      t.toLowerCase().includes(query)
    );
  }

  filterEducationLevel(event: any) {
    const query = event.query.toLowerCase();
    this.filteredEducationLevels = this.educationList.filter((e) =>
      e.toLowerCase().includes(query)
    );
  }

  filterArea(event: any) {
    const query = event.query.toLowerCase();
    this.filteredAreas = this.areaList.filter((a) =>
      a.toLowerCase().includes(query)
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
}
