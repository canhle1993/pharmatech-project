import { Component, OnInit, AfterViewInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common'; // ✅ thêm
import { ProgressSpinnerModule } from 'primeng/progressspinner'; // ✅ thêm
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Account } from '../../../entities/account.entity';
import { AccountService } from '../../../services/account.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule, ToastModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  providers: [MessageService],
})
export class ProfileComponent implements OnInit, AfterViewInit {
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
        education: result.education ?? {
          degree: '',
          university: '',
          graduation_year: '',
        },
        experience: result.experience ?? {
          company: '',
          position: '',
          years: '',
        },
      };

      // ✅ Fix đường dẫn ảnh
      if (this.account.photo && !this.account.photo.startsWith('http')) {
        this.account.photo =
          'http://localhost:3000/upload/' + this.account.photo;
      }

      console.log('✅ Dữ liệu account nhận được:', this.account);
    } catch (err) {
      console.error('❌ Lỗi khi lấy account:', err);
    } finally {
      this.loading = false;
    }
  }

  toggleEdit() {
    // ✅ đổi trạng thái khi bấm nút Edit
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
        const upload = await this.accountService.uploadPhoto(
          this.selectedPhoto
        );
        uploadedFilename = upload.filename; // DB sẽ lưu tên file
        this.account.photo = 'http://localhost:3000/upload/' + upload.filename; // UI hiển thị đầy đủ link
      }

      if (this.selectedResume) {
        const upload = await this.accountService.uploadResume(
          this.selectedResume
        );
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

  ngAfterViewInit() {
    // --- CSS ---
    const cssFiles = [
      'assets/css/vendor/bootstrap.min.css',
      'assets/css/vendor/lastudioicons.css',
      'assets/css/vendor/dliconoutline.css',
      'assets/css/animate.min.css',
      'assets/css/swiper-bundle.min.css',
      'assets/css/ion.rangeSlider.min.css',
      'assets/css/lightgallery-bundle.min.css',
      'assets/css/magnific-popup.css',
      'assets/css/style.css',
    ];
    cssFiles.forEach((href) => {
      const link = this.renderer.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      this.renderer.appendChild(document.head, link);
    });

    const fontLink = this.renderer.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href =
      'https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap';
    this.renderer.appendChild(document.head, fontLink);

    // --- JS ---
    const jsFiles = [
      'assets/js/vendor/modernizr-3.11.7.min.js',
      'assets/js/vendor/jquery-migrate-3.3.2.min.js',
      'assets/js/countdown.min.js',
      'assets/js/ajax.js',
      'assets/js/jquery.validate.min.js',
      'assets/js/vendor/jquery-3.6.0.min.js',
      'assets/js/vendor/bootstrap.bundle.min.js',
      'assets/js/swiper-bundle.min.js',
      'assets/js/ion.rangeSlider.min.js',
      'assets/js/lightgallery.min.js',
      'assets/js/jquery.magnific-popup.min.js',
      'assets/js/main.js',
    ];
    jsFiles.forEach((src) => {
      const script = this.renderer.createElement('script');
      script.src = src;
      script.type = 'text/javascript';
      this.renderer.appendChild(document.body, script);
    });
  }
}
