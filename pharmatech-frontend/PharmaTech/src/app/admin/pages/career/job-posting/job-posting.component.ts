import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';

// Services & Entities
import { CareerService } from '../../../../services/career.service';
import { Career } from '../../../../entities/career.entity';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    DialogModule,
  ],
  templateUrl: './job-posting.component.html',
  styleUrls: ['./job-posting.component.css'],
  providers: [ConfirmationService],
})
export class JobPostingComponent implements OnInit {
  careers: Career[] = [];
  loading = false;

  viewMode: 'active' | 'history' = 'active'; // ➕ ADD

  /** 🟣 Xem chi tiết */
  displayDetailDialog = false;
  selectedJobDetail: Career | null = null;

  constructor(
    private careerService: CareerService,
    private message: MessageService,
    private confirmation: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCareers();
    // 🟢 Hiển thị toast nếu có state được truyền từ form
    setTimeout(() => {
      const nav = history.state;
      if (nav.toastMessage) {
        console.log('✅ Received toast message:', nav.toastMessage);
        this.message.add(nav.toastMessage);
        history.replaceState({}, document.title); // xóa state sau khi hiển thị
      }
    });
  }

  /** 📦 Load danh sách job */
  async loadCareers() {
    this.loading = true;
    this.viewMode = 'active';
    try {
      const res = await this.careerService.findAll();
      this.careers = res as Career[];
    } catch {
      this.message.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load job listings.',
      });
    } finally {
      this.loading = false;
    }
  }

  /** 📜 Load danh sách job đã xóa (history) */
  async loadHistory() {
    // ➕ ADD
    this.loading = true;
    try {
      const res = await this.careerService.findHistory();
      this.careers = res as Career[];
      this.viewMode = 'history';
    } catch {
      this.message.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load history.',
      });
    } finally {
      this.loading = false;
    }
  }

  toggleHistory() {
    // ➕ ADD
    if (this.viewMode === 'active') this.loadHistory();
    else this.loadCareers();
  }

  /** ➕ Tạo mới job — chuyển sang trang khác */
  openAdd() {
    this.router.navigate(['/admin/career/job-add']);
  }

  /** ✏️ Chỉnh sửa job — chuyển sang trang khác */
  openEdit(job: Career) {
    const id = job.id ?? (job as any)._id;
    if (!id) return;
    this.router.navigate(['/admin/career/job-edit', id]);
  }

  /** 👁️ Xem chi tiết job */
  openDetail(job: Career) {
    this.selectedJobDetail = job;
    this.displayDetailDialog = true;
  }

  /** 🗑️ Xoá job (soft delete) */
  async deleteJob(job: Career) {
    const id = job.id ?? (job as any)._id;
    if (!id) {
      this.message.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Job ID not found.',
      });
      return;
    }

    this.confirmation.confirm({
      header: 'Are you sure?',
      message: 'Do you really want to delete this job?',
      accept: async () => {
        try {
          await this.careerService.delete(id);
          this.message.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Job deleted successfully.',
          });
          await this.loadCareers();
        } catch (err) {
          console.error('Delete error:', err);
          this.message.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete job.',
          });
        }
      },
    });
  }

  /** ♻ Khôi phục job từ history */
  async restore(job: Career) {
    // ➕ ADD
    const id = job.id ?? (job as any)._id;
    this.confirmation.confirm({
      header: 'Restore Job',
      message: 'Do you want to restore this job?',
      accept: async () => {
        await this.careerService.restore(id);
        this.message.add({
          severity: 'success',
          summary: 'Restored',
          detail: 'Job restored successfully.',
        });
        this.loadHistory();
      },
    });
  }

  /** ❌ Xóa vĩnh viễn */
  async deletePermanent(job: Career) {
    // ➕ ADD
    const id = job.id ?? (job as any)._id;
    this.confirmation.confirm({
      header: 'Delete Permanently',
      message: 'This action cannot be undone. Delete permanently?',
      accept: async () => {
        await this.careerService.deletePermanent(id);
        this.message.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Job permanently deleted.',
        });
        this.loadHistory();
      },
    });
  }
}
