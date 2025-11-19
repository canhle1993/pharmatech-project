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
import { CareerService } from '../../../services/career.service'; // ⭐ Thêm dòng này
import { Account } from '../../../entities/account.entity';

import { DatePickerModule } from 'primeng/datepicker';
import { SavedJob } from '../../../entities/saved-job.entity';
import { Router, RouterModule } from '@angular/router';

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

  /** Tabs */
  activeTab: 'info' | 'saved' = 'info';
  savedJobs: SavedJob[] = [];

  /** Ngày sinh min/max */
  minDate = new Date(1950, 0, 1);
  maxDate = new Date();

  /** Dropdown data */
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

  /** Filter options */
  filteredGenders: string[] = [];
  filteredWorkTypes: string[] = [];
  filteredEducationLevels: string[] = [];
  filteredAreas: string[] = [];

  constructor(
    private accountService: AccountService,
    private profileService: ProfileService,
    private careerService: CareerService, // ⭐ Dùng CareerService
    private messageService: MessageService,
    private router: Router
  ) {}

  // ======================================================
  //  ⭐ INIT PROFILE + LOAD SAVED JOBS
  // ======================================================
  async ngOnInit() {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const id = currentUser?.id || currentUser?._id;

    if (!id) {
      console.error('❌ No user ID found in localStorage');
      return;
    }

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

  // Save profile
  async saveChanges() {
    if (!this.account) return;

    this.loading = true;

    try {
      this.account = await this.profileService.uploadFiles(
        this.account,
        this.selectedPhoto,
        this.selectedResume
      );

      const errorMsg = this.profileService.validateProfile(this.account);
      if (errorMsg) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Incomplete',
          detail: errorMsg,
        });
        return;
      }

      const payload = this.profileService.buildPayload(this.account);

      const updated = await this.profileService.saveProfile(
        this.account,
        payload
      );

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

  // ======================================================
  // FILTERS
  // ======================================================
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

    (this.account as any).age = age;
  }
}
