import { Component, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';        // ✅ thêm
import { ProgressSpinnerModule } from 'primeng/progressspinner'; // ✅ thêm
import { ToastModule } from 'primeng/toast'; 
import { MessageService } from 'primeng/api';
import { Account } from '../../../../entities/account.entity';
import { AccountService } from '../../../../services/account.service';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
    imports: [CommonModule, DatePipe, ProgressSpinnerModule, ToastModule, FormsModule],
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
    const editMode = this.route.snapshot.queryParamMap.get('edit') === 'true'; // ✅ lấy query param
  
    if (!id) return;
  
    this.loading = true;
    try {
      const result = await this.accountService.findById(id);
  
      // ✅ Bổ sung fix ID (phòng trường hợp backend không trả đúng)
      if (!result.id && (result as any)._id) {
        result.id = (result as any)._id;
      }
  
      // ✅ Gán lại vào account
      this.account = {
        ...result,
        education: result.education ?? { degree: '', university: '', graduation_year: '' },
        experience: result.experience ?? { company: '', position: '', years: '' },
      };
  
      // ✅ Fix đường dẫn ảnh
      if (this.account.photo && !this.account.photo.startsWith('http')) {
        this.account.photo = 'http://localhost:3000/upload/' + this.account.photo;
      }
  
      // ✅ Nếu query param có edit=true thì bật sẵn chế độ chỉnh sửa
      if (editMode) {
        this.isEditing = true;
      }
  
      console.log('✅ Dữ liệu account nhận được:', this.account);
    } catch (err) {
      console.error('❌ Lỗi khi lấy account:', err);
    } finally {
      this.loading = false;
    }
  }
  
  toggleEdit() {     // ✅ đổi trạng thái khi bấm nút Edit
    this.isEditing = !this.isEditing;
    console.log('isEditing =', this.isEditing);
  }

  onPhotoSelected(event: any) {
    this.selectedPhoto = event.target.files[0];
  }
  
  onResumeSelected(event: any) {
    this.selectedResume = event.target.files[0];
  }
  
  async saveChanges() {
    try {
      let uploadedFilename: string | null = null;
  
      if (this.selectedPhoto) {
        const upload = await this.accountService.uploadPhoto(this.selectedPhoto);
        uploadedFilename = upload.filename; // DB sẽ lưu tên file
        this.account.photo = 'http://localhost:3000/upload/' + upload.filename; // UI hiển thị đầy đủ link
      }
  
      if (this.selectedResume) {
        const upload = await this.accountService.uploadResume(this.selectedResume);
        this.account.resume = upload.url;
      }
  
      const updatedData = {
        ...this.account,
        education: {
          degree: this.account.education?.degree || '',
          university: this.account.education?.university || '',
          graduation_year: this.account.education?.graduation_year || null,
        },
        experience: {
          company: this.account.experience?.company || '',
          position: this.account.experience?.position || '',
          years: this.account.experience?.years || null,
        },
        photo: uploadedFilename
          ? uploadedFilename
          : this.account.photo?.replace('http://localhost:3000/upload/', ''),
      };
  
      console.log('📤 Payload gửi lên server:', updatedData);
  
      const updated = await this.accountService.update(
        this.account.id || this.account._id!,
        updatedData
      );
  
      this.account = {
        ...this.account,
        ...updated,
        education: {
          ...updated.education,
        },
        experience: {
          ...updated.experience,
        },
      };
  
      this.messageService.add({
        severity: 'success',
        summary: 'Saved',
        detail: 'Profile updated successfully!',
      });
  
      this.isEditing = false;
    } catch (error) {
      console.error('❌ Lỗi khi lưu profile:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update profile!',
      });
    }
  }
  
}
