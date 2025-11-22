import { Component, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Account } from '../../../../entities/account.entity';
import { AccountService } from '../../../../services/account.service';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { env } from '../../../../enviroments/enviroment';
import { DatePickerModule } from 'primeng/datepicker';
import { UserStateService } from '../../../../services/user-state.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ProgressSpinnerModule,
    ToastModule,
    FormsModule,
    MultiSelectModule,
    DatePickerModule,
  ],
  templateUrl: './accountdetails.component.html',
  styleUrls: ['./accountdetails.component.css'],
  providers: [MessageService],
})
export class AccountDetailsComponent implements OnInit {
  account: Account | null = null;
  loading = false;
  isEditing = false;
  selectedPhoto?: File;
  selectedResume?: File;
  currentUserRoles: string[] = [];
  /** Ngày sinh min/max */
  minDate = new Date(1950, 0, 1);
  maxDate = new Date(); // hôm nay
  previewPhotoUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private userState: UserStateService,
    private accountService: AccountService,
    private messageService: MessageService,
    private renderer: Renderer2
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const editMode = this.route.snapshot.queryParamMap.get('edit') === 'true';

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.currentUserRoles = currentUser.roles || [];

    if (!id) return;
    this.loading = true;

    try {
      const result = await this.accountService.findById(id);
      if (!result.id && (result as any)._id) result.id = (result as any)._id;

      // 🧩 Gán cấu trúc mặc định (đồng bộ backend)
      this.account = {
        ...result,
        education: result.education ?? {
          education_level: '',
          major: '',
          school_name: '',
          graduation_year: undefined,
        },
        experience: result.experience ?? {
          company_name: '',
          job_title: '',
          working_years: undefined,
          responsibilities: '',
        },
      };

      // ✅ Fix ảnh đầy đủ URL
      if (this.account.photo && !this.account.photo.startsWith('http')) {
        this.account.photo = `${env.baseUrl.replace('/api/', '')}upload/${
          this.account.photo
        }`;
      }

      if (editMode) this.isEditing = true;

      console.log('✅ Account detail loaded:', this.account);
    } catch (err) {
      console.error('❌ Lỗi khi lấy account:', err);
    } finally {
      this.loading = false;
    }
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
  // canShowEditButton(target: Account): boolean {
  //   // SUPERADMIN → chỉ thấy admin + user
  //   if (this.currentUserRoles.includes('superadmin')) {
  //     return true;
  //   }

  //   // ADMIN → chỉ thấy user
  //   if (this.currentUserRoles.includes('admin')) {
  //     return target.roles.includes('user');
  //   }

  //   // USER → không được edit ai hết
  //   return false;
  // }
  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedPhoto = file;

    // 👉 Preview realtime
    const reader = new FileReader();
    reader.onload = () => {
      this.previewPhotoUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onResumeSelected(event: any) {
    this.selectedResume = event.target.files[0];
  }

  async saveChanges() {
    if (!this.account) return;

    try {
      this.loading = true;

      let photoFilename = this.account.photo;

      // Nếu admin upload ảnh mới
      if (this.selectedPhoto) {
        const uploadRes = await this.accountService.uploadPhoto(
          this.selectedPhoto
        );
        photoFilename = uploadRes.filename;
      }

      // Payload chỉ chứa các field basic info
      const updatedData = {
        name: this.account.name,
        phone: this.account.phone,
        email: this.account.email,
        address: this.account.address,
        gender: this.account.gender,
        dob: this.account.dob,
        photo: photoFilename, // chỉ filename!
      };

      console.log('📤 Payload gửi lên server:', updatedData);

      const updated = await this.accountService.updateBasic(
        this.account.id || this.account._id!,
        updatedData
      );

      // updated = { msg: "...", data: {...accountDTO} }

      this.account = {
        ...this.account,
        ...updated.data,
      };

      // 🔥 lưu đúng object account
      localStorage.setItem('currentUser', JSON.stringify(updated.data));

      // 🔥 Cập nhật realtime lên Header
      this.userState.setUser(updated.data);

      this.messageService.add({
        severity: 'success',
        summary: 'Saved',
        detail: 'Account updated successfully!',
      });

      this.isEditing = false;
    } catch (error) {
      console.error('❌ Lỗi khi lưu profile:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update account!',
      });
    } finally {
      this.loading = false;
    }
  }
}
