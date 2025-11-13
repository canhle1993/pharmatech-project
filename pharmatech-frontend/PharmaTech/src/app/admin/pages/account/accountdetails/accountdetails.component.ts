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

@Component({
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ProgressSpinnerModule,
    ToastModule,
    FormsModule,
    MultiSelectModule,
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

  constructor(
    private route: ActivatedRoute,
    private accountService: AccountService,
    private messageService: MessageService,
    private renderer: Renderer2
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const editMode = this.route.snapshot.queryParamMap.get('edit') === 'true';

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

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  onPhotoSelected(event: any) {
    this.selectedPhoto = event.target.files[0];
  }

  onResumeSelected(event: any) {
    this.selectedResume = event.target.files[0];
  }

  async saveChanges() {
    if (!this.account) return;

    try {
      this.loading = true;
      let uploadedFilename: string | null = null;

      // 📸 Upload avatar nếu có chọn file
      if (this.selectedPhoto) {
        const upload = await this.accountService.uploadPhoto(
          this.selectedPhoto
        );
        uploadedFilename = upload.filename;
        this.account.photo = `${env.baseUrl.replace('/api/', '')}upload/${
          upload.filename
        }`;
      }

      // 📄 Upload resume nếu có chọn file
      if (this.selectedResume) {
        const upload = await this.accountService.uploadResume(
          this.selectedResume
        );
        this.account.resume = upload.url;
      }

      // 🔹 Chuẩn hóa payload gửi backend
      const updatedData = {
        ...this.account,
        photo: uploadedFilename
          ? uploadedFilename
          : this.account.photo?.split('/upload/')[1],

        education: {
          education_level: this.account.education?.education_level || '',
          major: this.account.education?.major || '',
          school_name: this.account.education?.school_name || '',
          graduation_year: this.account.education?.graduation_year || null,
        },
        experience: {
          company_name: this.account.experience?.company_name || '',
          job_title: this.account.experience?.job_title || '',
          working_years: this.account.experience?.working_years || null,
          responsibilities: this.account.experience?.responsibilities || '',
        },

        // 🔸 Chuẩn hóa các list array (nếu có)
        field: this.account.field?.map((f: any) =>
          typeof f === 'string' ? f : f.name
        ),
        skills: this.account.skills?.map((s: any) =>
          typeof s === 'string' ? s : s.name
        ),
        languages: this.account.languages?.map((l: any) =>
          typeof l === 'string' ? l : l.name
        ),
      };

      console.log('📤 Payload gửi lên server:', updatedData);

      const updated = await this.accountService.update(
        this.account.id || this.account._id!,
        updatedData
      );

      this.account = {
        ...this.account,
        ...updated,
        education: { ...updated.education },
        experience: { ...updated.experience },
      };

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
