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

import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

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
  applications: Application[] = [];
  loading = false;
  role = ''; // 👑 Vai trò hiện tại (superadmin / admin / user)
  admins: any[] = []; // Danh sách admin

  // 🧩 DIALOG STATES
  showAssignDialog = false;
  showInterviewDialog = false;
  // === Dialog flags & data ===
  showViewDialog = false;
  showResultDialog = false;
  viewing: Application | null = null;
  resultData: {
    status: 'pass' | 'fail';
    hired_department?: string;
    hired_start_date?: any;
    note?: string;
  } = { status: 'pass' };

  selectedApp: Application | null = null;
  filteredAdmins: any[] = []; // ✅ Dữ liệu gợi ý lọc khi nhập
  assignAdminData = { admin: null as any }; // ✅ Chọn admin trực tiếp
  interviewData = { date: '', location: '', note: '' };

  /** Các trạng thái xử lý của hồ sơ */
  statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'Reviewed', value: 'reviewed' },
    { label: 'Interview', value: 'interview' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Rejected', value: 'rejected' },
  ];
  filteredStatus: string[] = [];

  constructor(
    private appService: ApplicationService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
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

  /** 🟢 Load danh sách ứng viên */
  /** 🟢 Load danh sách ứng viên */
  async loadApplications() {
    try {
      this.loading = true;
      const result = await this.appService.findAll();

      // 🧠 Chuẩn hóa dữ liệu hiển thị (giữ nguyên toàn bộ field, không mất assigned_admin_name)
      this.applications = result.map((item: any) => ({
        ...item, // ⚡ Giữ lại tất cả field gốc như assigned_admin_name, assigned_admin_id, status, v.v.
        account: {
          ...item.account_id,
          photo: item.account_id?.photo
            ? item.account_id.photo.startsWith('http')
              ? item.account_id.photo
              : `http://localhost:3000/upload/${item.account_id.photo}`
            : 'assets/images/users/default-avatar.png',
        },
        career: item.career_id,
      }));
    } catch (err: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load applications.',
      });
    } finally {
      this.loading = false;
    }
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

  /** 🗑️ Xóa hồ sơ */
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
          await this.appService.delete(app.id!);
          this.applications = this.applications.filter((a) => a.id !== app.id);
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Application deleted successfully',
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
  openInterviewDialog(app: Application) {
    this.selectedApp = app;
    this.interviewData = { date: '', location: '', note: '' };
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
    if (!this.interviewData.date || !this.interviewData.location) return;

    try {
      this.loading = true;
      await this.appService.scheduleInterview(
        this.selectedApp!.id!,
        this.interviewData.date,
        this.interviewData.location,
        this.interviewData.note
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Scheduled',
        detail: 'Interview scheduled successfully!',
      });

      this.showInterviewDialog = false;
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

  openViewDialog(app: Application) {
    this.viewing = app;
    this.showViewDialog = true;
  }

  // Gọi dialog Update Result thay vì prompt()
  openResultDialog(app: Application, passed: boolean) {
    this.selectedApp = app;
    this.resultData = {
      status: passed ? 'pass' : 'fail',
      hired_department: '',
      hired_start_date: '',
      note: '',
    };
    this.showResultDialog = true;
  }

  // Thay vì gọi updateResult(row, true/false) trực tiếp từ nút,
  // bạn gọi openResultDialog(row, true/false) trong HTML (nếu muốn).
  // Còn nếu bạn giữ nút cũ thì dùng confirmUpdateResult() bên dưới.

  async confirmUpdateResult() {
    if (!this.selectedApp) return;
    try {
      this.loading = true;
      await this.appService.updateResult(
        this.selectedApp.id!,
        this.resultData.status === 'pass' ? 'pass' : 'fail',
        this.resultData.hired_department,
        this.resultData.hired_start_date
      );
      this.messageService.add({
        severity: 'success',
        summary: 'Result updated',
        detail:
          this.resultData.status === 'pass'
            ? 'Candidate passed interview!'
            : 'Candidate failed interview.',
      });
      this.showResultDialog = false;
      await this.loadApplications();
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update result.',
      });
    } finally {
      this.loading = false;
    }
  }

  onDialogHide() {
    this.selectedApp = null;
    this.assignAdminData = { admin: null };
    this.interviewData = { date: '', location: '', note: '' };
    this.resultData = { status: 'pass' };
    this.viewing = null;
  }

  /** 🟢 Lấy danh sách account có role 'admin' */
  async loadAdmins() {
    try {
      const result = await this.appService.findAllAdmins();
      console.log('✅ API findAllAdmins result:', result);
      this.admins = (result || []).map((a: any) => {
        const id = a.id ?? a._id ?? a.accountId;
        const name = a.full_name ?? a.FullName ?? a.name ?? 'Unknown';
        const email = a.email ?? a.Email ?? '';
        const photoRaw = a.photo ?? a.Photo ?? '';
        const photo = photoRaw
          ? photoRaw.startsWith('http')
            ? photoRaw
            : `http://localhost:3000/upload/${photoRaw}`
          : undefined;
        return {
          id,
          name,
          email,
          photo,
          label: email ? `${name} (${email})` : name,
        };
      });
    } catch (error) {
      console.error('❌ Load admins failed:', error);
    }
  }

  /** 🔍 Lọc gợi ý admin khi gõ */
  searchAdmins(event: any) {
    const query = (event.query || '').toLowerCase();
    this.filteredAdmins = this.admins.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        (a.email ?? '').toLowerCase().includes(query)
    );
  }
}
