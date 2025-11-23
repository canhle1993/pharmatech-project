import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { Application } from '../../../../entities/application.entity';
import { ApplicationService } from '../../../../services/application.service';
import { ReactiveFormsModule } from '@angular/forms';

// ✅ PrimeNG modules
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { EditorModule } from 'primeng/editor';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { AuthRoleService } from '../../../../core/auth/auth-role.service';

@Component({
  selector: 'app-application-management',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ToastModule,
    ReactiveFormsModule,
    AutoCompleteModule,
    ButtonModule,
    TooltipModule,
    TagModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    EditorModule,
    DatePickerModule,
    ConfirmDialogModule,
  ],
  templateUrl: './application-management.component.html',
  styleUrls: ['./application-management.component.css'],
  providers: [MessageService, ConfirmationService],
})
export class ApplicationManagementComponent implements OnInit {
  today = new Date();
  applications: Application[] = [];
  loading = false;
  role = ''; // 👑 Vai trò hiện tại (superadmin / admin / user)
  admins: any[] = []; // Danh sách admin

  // 🧩 DIALOG STATES
  showAssignDialog = false;
  showInterviewDialog = false;
  // === Dialog flags & data ===
  showViewDialog = false;
  // ====== PASS / REJECT DIALOGS ======
  showPassDialog = false;
  showRejectDialog = false;
  viewing: Application | null = null;

  selectedApp: Application | null = null;
  filteredAdmins: any[] = []; // ✅ Dữ liệu gợi ý lọc khi nhập
  assignAdminData = { admin: null as any }; // ✅ Chọn admin trực tiếp
  interviewData = { date: '', location: '', note: '' };

  emailHtmlOriginal = '';
  emailHtml = '';

  viewMode: 'active' | 'history' = 'active';

  /** Các trạng thái xử lý của hồ sơ */
  statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'Reviewed', value: 'reviewed' },
    { label: 'Interview', value: 'interview' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Rejected', value: 'rejected' },
  ];
  filteredStatus: string[] = [];

  passData = {
    start_work_date: '',
    location: '',
    email_content: '',
  };

  rejectData = {
    reason: '',
    rejected_by: '',
    email_content: '',
  };

  resumeUrl: string | null = null;
  isImageResume = false;
  isPdfResume = false;
  showResumeFullscreen = false;
  resumeSafeUrl: SafeResourceUrl | null = null;

  constructor(
    private appService: ApplicationService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private sanitizer: DomSanitizer,
    public authRole: AuthRoleService
  ) {}

  /** 🟢 Khi khởi tạo component → lấy toàn bộ danh sách ứng tuyển */
  async ngOnInit(): Promise<void> {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.role = currentUser?.roles?.[0]?.toLowerCase() || 'user';
    await Promise.all([
      this.loadApplications(),
      this.loadAdmins(), // 🟢 load thêm danh sách admin
    ]);
  }

  toggleHistory() {
    if (this.viewMode === 'active') {
      this.viewMode = 'history';
      this.loadHistory();
    } else {
      this.viewMode = 'active';
      this.loadApplications();
    }
  }

  async loadHistory() {
    try {
      this.loading = true;
      const result = await this.appService.findHistory();

      this.applications = result.map((item: any) => {
        const acc = item.account || item.account_id || {};

        return {
          ...item,
          account: {
            ...acc,
            photo: acc.photo
              ? acc.photo.startsWith('http')
                ? acc.photo
                : `http://localhost:3000/upload/${acc.photo}`
              : 'assets/images/users/default-avatar.png',
          },
          career: item.career || item.career_id,
        };
      });
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load history list.',
      });
    } finally {
      this.loading = false;
    }
  }

  async restoreApplication(app: Application) {
    this.confirmationService.confirm({
      header: 'Restore Application',
      message: 'Are you sure you want to restore this application?',
      icon: 'pi pi-refresh',
      acceptLabel: 'Restore',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-text',

      accept: async () => {
        try {
          this.loading = true;
          await this.appService.restore(app.id!);

          this.messageService.add({
            severity: 'success',
            summary: 'Restored',
            detail: 'Application restored successfully.',
          });

          await this.loadHistory();
        } catch {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to restore application.',
          });
        } finally {
          this.loading = false;
        }
      },
    });
  }

  async deletePermanent(app: Application) {
    this.confirmationService.confirm({
      header: 'Delete Permanently',
      message: 'This action cannot be undone. Delete permanently?',
      icon: 'pi pi-times-circle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',

      accept: async () => {
        try {
          this.loading = true;
          await this.appService.deletePermanent(app.id!);

          this.messageService.add({
            severity: 'info',
            summary: 'Deleted',
            detail: 'Application permanently deleted.',
          });

          await this.loadHistory();
        } catch {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Delete permanent failed.',
          });
        } finally {
          this.loading = false;
        }
      },
    });
  }

  /** 🟢 Load danh sách ứng viên */

  async loadApplications() {
    try {
      this.loading = true;
      const result = await this.appService.findAll();

      this.applications = result.map((item: any) => {
        const acc = item.account || item.account_id || {};

        // ⭐ FIX DATE HERE: Convert dd/MM/YYYY HH:mm → Date()
        const createdAt = item.created_at
          ? this.parseDate(item.created_at)
          : null;

        const updatedAt = item.updated_at
          ? this.parseDate(item.updated_at)
          : null;

        return {
          ...item,
          created_at: createdAt, // ⭐ trả về Date object
          updated_at: updatedAt,
          account: {
            ...acc,
            photo: acc.photo
              ? acc.photo.startsWith('http')
                ? acc.photo
                : `http://localhost:3000/upload/${acc.photo}`
              : 'assets/images/users/default-avatar.png',

            resume: acc.resume
              ? acc.resume.startsWith('http')
                ? acc.resume
                : `http://localhost:3000/upload/${acc.resume}`
              : null,

            skills: Array.isArray(acc.skills) ? acc.skills : [],
            field: Array.isArray(acc.field) ? acc.field : [],
            languages: Array.isArray(acc.languages) ? acc.languages : [],
            education: acc.education ?? {},
            experience: acc.experience ?? {},
            introduction: acc.introduction ?? '',
          },
          career: item.career || item.career_id,
        };
      });
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load applications.',
      });
    } finally {
      this.loading = false;
    }
  }

  parseDate(str: string): Date | null {
    // str dạng "16/11/2025 11:02"
    const parts = str.split(/[\s/:]/);
    if (parts.length < 5) return null;

    const [day, month, year, hour, minute] = parts.map(Number);

    return new Date(year, month - 1, day, hour, minute);
  }

  /** 🧭 Admin → Lên lịch phỏng vấn */
  async scheduleInterview(app: Application) {
    const interview_date = prompt(
      'Nhập ngày giờ phỏng vấn (YYYY-MM-DD HH:mm):'
    );
    const interview_location = prompt('Nhập địa điểm hoặc link phỏng vấn:');
    const interview_note = prompt('Ghi chú (tùy chọn):');

    if (!interview_date || !interview_location) return;

    try {
      this.loading = true;
      await this.appService.scheduleInterview(
        app.id!,
        interview_date,
        interview_location,
        interview_note || ''
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Scheduled',
        detail: 'Interview scheduled successfully!',
      });

      await this.loadApplications();
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to schedule interview.',
      });
    } finally {
      this.loading = false;
    }
  }

  /** 🟡 Xóa mềm – chuyển vào HISTORY */
  async deleteApplication(app: Application) {
    this.confirmationService.confirm({
      header: 'Delete Application',
      message: 'Are you sure you want to delete this application?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',

      accept: async () => {
        try {
          this.loading = true;

          // ⛳ GỌI HÀM MỚI – softDelete(id)
          await this.appService.softDelete(app.id!);

          // Xóa khỏi FE list
          this.applications = this.applications.filter((a) => a.id !== app.id);

          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Application moved to history',
          });
        } catch (err) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete application',
          });
        } finally {
          this.loading = false;
        }
      },
    });
  }

  /** 🎨 Badge màu và hiệu ứng nhấp nháy theo trạng thái */
  getBadgeSeverity(status: string): string {
    if (!status) return 'pending';
    const lower = status.toLowerCase();

    switch (lower) {
      case 'accepted':
      case 'hired':
      case 'passed':
        return 'hired'; // 🟢 xanh lá, nhấp nháy nhẹ
      case 'interview':
      case 'scheduled':
        return 'interview'; // 🔵 xanh dương
      case 'assigned':
        return 'assigned'; // 🟠 cam nhấp nháy
      case 'rejected':
      case 'failed':
        return 'rejected'; // 🔴 đỏ
      case 'reviewed':
        return 'reviewed'; // ⚪ xám nhạt (tĩnh)
      case 'pending':
      default:
        return 'pending'; // 🟡 vàng nhấp nháy
    }
  }

  /** 🧩 SuperAdmin → Mở dialog phân công admin */
  async openAssignDialog(app: Application) {
    this.selectedApp = app;
    this.assignAdminData = { admin: null };

    // Nếu chưa có danh sách admin thì load
    if (!this.admins.length) {
      await this.loadAdmins();
    }

    this.showAssignDialog = true;
  }

  /** 🧭 Admin → Mở dialog lên lịch phỏng vấn */
  async openInterviewDialog(app: Application) {
    this.selectedApp = app;
    this.interviewData = { date: '', location: '', note: '' };

    try {
      // gọi template gốc từ BE
      this.emailHtmlOriginal = await this.appService.getEmailTemplate(app.id!);
    } catch {
      this.emailHtmlOriginal = `
        <p>Dear {{candidate_name}},</p>
        <p>We would like to invite you to an interview.</p>
        <p><b>Time:</b> {{interview_time}}</p>
        <p><b>Location:</b> {{interview_location}}</p>
      `;
    }

    // tạo email realtime ban đầu
    this.updateEmailPreview();

    this.showInterviewDialog = true;
  }

  /** ✅ Thực hiện phân công admin */
  async confirmAssignAdmin() {
    const selected = this.assignAdminData.admin;
    if (!selected) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing',
        detail: 'Please choose an admin.',
      });
      return;
    }

    try {
      this.loading = true;

      // ✅ Gửi đúng key mà BE controller nhận
      await this.appService.assignAdmin(
        this.selectedApp!.id!,
        selected.id, // admin_id
        selected.name // admin_name
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Assigned',
        detail: `Assigned to ${selected.name}`,
      });

      this.showAssignDialog = false;
      await this.loadApplications(); // ✅ reload danh sách để thấy admin name mới
    } catch (err) {
      console.error('❌ Assign admin error:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to assign admin.',
      });
    } finally {
      this.loading = false;
    }
  }

  /** ✅ Thực hiện lưu lịch phỏng vấn */
  async confirmScheduleInterview() {
    if (!this.interviewData.date || !this.interviewData.location) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing info',
        detail: 'Please fill date & location.',
      });
      return;
    }

    try {
      this.loading = true;
      await this.appService.scheduleInterview(
        this.selectedApp!.id!,
        this.interviewData.date,
        this.interviewData.location,
        this.emailHtml // FE gửi email HTML đã preview
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Interview scheduled!',
      });

      this.showInterviewDialog = false;
      await this.loadApplications();
    } finally {
      this.loading = false;
    }
  }

  openViewDialog(app: Application) {
    this.viewing = app;
    this.showViewDialog = true;

    // ⭐ LẤY RESUME TỪ ACCOUNT
    const file = app.account?.resume;

    if (!file) {
      this.resumeUrl = null;
      this.resumeSafeUrl = null;
      this.isPdfResume = false;
      this.isImageResume = false;
      return;
    }

    // ⭐ GÁN RESUME URL
    this.resumeUrl = file;

    // ⭐ TẠO SANITIZED URL CHO PDF
    this.resumeSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(file);

    // ⭐ XÁC ĐỊNH LOẠI FILE
    this.isImageResume = /\.(jpg|jpeg|png|gif|bmp)$/i.test(file);
    this.isPdfResume = /\.pdf$/i.test(file);
  }

  openResumeFullscreen() {
    this.showResumeFullscreen = true;
  }

  onDialogHide() {
    this.selectedApp = null;
    this.emailHtml = '';
    this.emailHtmlOriginal = '';
    this.interviewData = { date: '', location: '', note: '' };
  }

  /** 🟢 Lấy danh sách account có role 'admin' */
  async loadAdmins() {
    try {
      const result = await this.appService.findAllAdmins();

      console.log('🔥 RAW ADMIN LIST:', result);

      this.admins = result.map((a: any) => {
        const name =
          a.full_name ||
          a.name ||
          a.username ||
          a.email?.split('@')[0] ||
          'Unknown';

        return {
          id: a._id,
          name: name,
          email: a.email || '',
          photo: a.photo
            ? a.photo.startsWith('http')
              ? a.photo
              : `http://localhost:3000/upload/${a.photo}`
            : undefined,
          label: `${name} (${a.email})`,
        };
      });
    } catch (err) {
      console.error('❌ Load admins failed:', err);
    }
  }

  /** 🔍 Lọc gợi ý admin khi gõ */
  searchAdmins(event: any) {
    const q = (event.query || '').toLowerCase();

    this.filteredAdmins = this.admins.filter((a) => {
      const name = (a.name || '').toLowerCase();
      const email = (a.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }

  updateEmailPreview() {
    this.emailHtml = this.emailHtmlOriginal
      .replace('{{candidate_name}}', this.selectedApp?.account?.name || '')
      .replace('{{job_title}}', this.selectedApp?.career?.title || '')
      .replace('{{interview_time}}', this.interviewData.date || '—')
      .replace('{{interview_location}}', this.interviewData.location || '—');
  }

  async openPassDialog(app: Application) {
    this.selectedApp = app;

    this.passData = {
      start_work_date: '',
      location: '',
      email_content: '',
    };

    try {
      this.emailHtmlOriginal = await this.appService.getPassEmailTemplate(
        app.id!
      );
    } catch {
      this.emailHtmlOriginal = `
      <p>Dear {{candidate_name}},</p>
      <p>Congratulations! You passed the interview for <b>{{job_title}}</b>.</p>
      <p>Start date: <b>{{start_work_date}}</b></p>
      <p>Location: <b>{{location}}</b></p>
    `;
    }

    this.updatePassPreview();
    this.showPassDialog = true;
  }

  updatePassPreview() {
    this.passData.email_content = this.emailHtmlOriginal
      .replace('{{candidate_name}}', this.selectedApp?.account?.name || '')
      .replace('{{job_title}}', this.selectedApp?.career?.title || '')
      .replace('{{start_work_date}}', this.passData.start_work_date || '—')
      .replace('{{location}}', this.passData.location || '—');
  }

  async confirmMarkAsPass() {
    if (!this.passData.start_work_date || !this.passData.location) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing info',
        detail: 'Start date & location are required!',
      });
      return;
    }

    try {
      this.loading = true;

      await this.appService.markAsPass(
        this.selectedApp!.id!,
        this.passData.start_work_date,
        this.passData.location,
        this.passData.email_content
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Passed',
        detail: 'Candidate marked as PASS and email sent.',
      });

      this.showPassDialog = false;
      await this.loadApplications();
    } finally {
      this.loading = false;
    }
  }

  async openRejectDialog(app: Application) {
    this.selectedApp = app;

    this.rejectData = {
      reason: '',
      rejected_by: '',
      email_content: '',
    };

    try {
      this.emailHtmlOriginal = await this.appService.getRejectEmailTemplate(
        app.id!
      );
    } catch {
      this.emailHtmlOriginal = `
      <p>Dear {{candidate_name}},</p>
      <p>Thank you for your interest in <b>{{job_title}}</b>.</p>
      <p>After careful consideration, we regret to inform you that we will not move forward.</p>
      <p><b>Reason:</b> {{reason}}</p>
      <p><b>Reviewed by:</b> {{rejected_by}}</p>
    `;
    }

    this.updateRejectPreview();
    this.showRejectDialog = true;
  }

  updateRejectPreview() {
    this.rejectData.email_content = this.emailHtmlOriginal
      .replace('{{candidate_name}}', this.selectedApp?.account?.name || '')
      .replace('{{job_title}}', this.selectedApp?.career?.title || '')
      .replace('{{reason}}', this.rejectData.reason || '—')
      .replace('{{rejected_by}}', this.rejectData.rejected_by || '—');
  }

  async confirmMarkAsReject() {
    if (!this.rejectData.reason) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing info',
        detail: 'Reason is required!',
      });
      return;
    }

    try {
      this.loading = true;

      await this.appService.markAsReject(
        this.selectedApp!.id!,
        this.rejectData.reason,
        this.rejectData.email_content,
        this.rejectData.rejected_by
      );

      this.messageService.add({
        severity: 'info',
        summary: 'Rejected',
        detail: 'Candidate marked as REJECTED and email sent.',
      });

      this.showRejectDialog = false;
      await this.loadApplications();
    } finally {
      this.loading = false;
    }
  }
}
