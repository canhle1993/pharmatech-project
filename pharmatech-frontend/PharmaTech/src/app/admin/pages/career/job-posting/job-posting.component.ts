import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

// Services & Entities
import { CareerService } from '../../../../services/career.service';
import { Career } from '../../../../entities/career.entity';

@Component({
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    ProgressSpinnerModule,
    ConfirmDialogModule,
  ],
  templateUrl: './job-posting.component.html',
  styleUrls: ['./job-posting.component.css'],
  providers: [MessageService, ConfirmationService],
})
export class JobPostingComponent implements OnInit {
  careers: Career[] = [];
  loading = false;

  /** Dialogs */
  displayAddDialog = false;
  displayEditDialog = false;

  addForm!: FormGroup;
  editForm!: FormGroup;
  // 🆕 Dialog xem chi tiết
  displayDetailDialog = false;
  selectedJobDetail: Career | null = null;

  openDetail(job: Career) {
    this.selectedJobDetail = job;
    this.displayDetailDialog = true;
  }

  bannerFileAdd: File | null = null;
  bannerFileEdit: File | null = null;

  constructor(
    private fb: FormBuilder,
    private careerService: CareerService,
    private message: MessageService,
    private confirmation: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadCareers();
    this.initForms();
    // Theo dõi thay đổi ngày để kiểm tra hợp lệ
    this.editForm?.get('posted_date')?.valueChanges.subscribe(() => {
      this.validateDateRange();
    });

    this.editForm?.get('expiration_date')?.valueChanges.subscribe(() => {
      this.validateDateRange();
    });
  }

  /** Initialize reactive forms */
  private initForms(): void {
    this.addForm = this.fb.group({
      title: ['', Validators.required],
      department: ['', Validators.required],
      location: ['', Validators.required],
      description: [''],
      requirements: [''],
      salary_range: [''],
      posted_by: ['', Validators.required],
      banner: [''],
      quantity: [null],
      level: [''],
      experience: [''],
      work_type: [''],
      area: [''],
      posted_date: [new Date()],
      expiration_date: [null],
    });

    this.editForm = this.fb.group({
      id: [''],
      title: ['', Validators.required],
      department: ['', Validators.required],
      location: ['', Validators.required],
      description: [''],
      requirements: [''],
      salary_range: [''],
      posted_by: ['', Validators.required],
      banner: [''],
      quantity: [null],
      level: [''],
      experience: [''],
      work_type: [''],
      area: [''],
      posted_date: [new Date()],
      expiration_date: [null],
    });
  }

  /** Load all careers */
  async loadCareers() {
    this.loading = true;
    try {
      const res = await this.careerService.findAll();
      this.careers = res as Career[];
      console.log('📦 Job data loaded:', this.careers);
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

  /** Open Add Dialog */
  openAdd() {
    this.addForm.reset();
    this.bannerFileAdd = null;
    this.displayAddDialog = true;
  }

  /** Format ngày về yyyy-MM-dd để hiển thị đúng trong input type="date" */
  private formatDateInput(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${d.getFullYear()}-${month}-${day}`;
  }

  /** Kiểm tra nếu posted_date > expiration_date thì cảnh báo */
  private validateDateRange(): void {
    const posted = this.editForm.get('posted_date')?.value;
    const expire = this.editForm.get('expiration_date')?.value;
    if (posted && expire && new Date(posted) > new Date(expire)) {
      this.message.add({
        severity: 'warn',
        summary: 'Invalid Date',
        detail: 'Posted date cannot be later than expiration date!',
      });
      // Reset lại expiration_date cho an toàn
      this.editForm.patchValue({ expiration_date: null });
    }
  }

  /** Open Edit Dialog */
  openEdit(job: Career) {
    this.editForm.patchValue({
      id: job.id ?? (job as any)._id,
      title: job.title,
      department: job.department,
      location: job.location,
      description: job.description,
      requirements: job.requirements,
      salary_range: job.salary_range,
      posted_by: job.posted_by,
      level: job.level,
      experience: job.experience,
      work_type: job.work_type,
      quantity: job.quantity,
      area: job.area,

      // 🗓️ Hiển thị ngày chính xác
      posted_date: this.formatDateInput(job.posted_date),
      expiration_date: this.formatDateInput(job.expiration_date),

      banner: job.banner,
    });

    this.bannerFileEdit = null;
    this.displayEditDialog = true;
  }

  /** Select banner file */
  onFileSelect(event: any, type: 'add' | 'edit') {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (type === 'add') {
          this.bannerFileAdd = file;
          this.addForm.patchValue({ banner: reader.result });
        } else {
          this.bannerFileEdit = file;
          this.editForm.patchValue({ banner: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  }

  /** Create new job */
  async createJob() {
    if (this.addForm.invalid) {
      this.message.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please fill in all required fields.',
      });
      return;
    }

    const formData = new FormData();
    Object.entries(this.addForm.value).forEach(([k, v]) => {
      if (v) formData.append(k, String(v));
    });
    if (this.bannerFileAdd) formData.append('banner', this.bannerFileAdd);

    this.confirmation.confirm({
      header: 'Are you sure?',
      message: 'Do you want to create this new job?',
      accept: async () => {
        try {
          await this.careerService.create(formData);
          this.message.add({
            severity: 'success',
            summary: 'Created',
            detail: 'Job has been created successfully.',
          });
          this.displayAddDialog = false;
          await this.loadCareers();
        } catch (err) {
          console.error(err);
          this.message.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create job.',
          });
        }
      },
      reject: () => {
        this.message.add({
          severity: 'info',
          summary: 'Cancelled',
          detail: 'Creation has been cancelled.',
        });
      },
    });
  }

  /** Update existing job */
  async updateJob() {
    if (this.editForm.invalid) {
      this.message.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please fill in all required fields.',
      });
      return;
    }

    const id = this.editForm.value.id;
    if (!id) {
      this.message.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Job ID not found.',
      });
      return;
    }

    const formData = new FormData();
    Object.entries(this.editForm.value).forEach(([k, v]) => {
      if (v) formData.append(k, String(v));
    });
    if (this.bannerFileEdit) formData.append('banner', this.bannerFileEdit);

    this.confirmation.confirm({
      header: 'Are you sure?',
      message: 'Do you want to update this job?',
      accept: async () => {
        try {
          await this.careerService.update(id, formData);
          this.message.add({
            severity: 'success',
            summary: 'Updated',
            detail: 'Job has been updated successfully.',
          });
          this.displayEditDialog = false;
          await this.loadCareers();
        } catch (err) {
          console.error(err);
          this.message.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update job.',
          });
        }
      },
      reject: () => {
        this.message.add({
          severity: 'info',
          summary: 'Cancelled',
          detail: 'Update has been cancelled.',
        });
      },
    });
  }

  /** Delete job with confirmation */
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
            detail: 'Job has been deleted successfully.',
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
      reject: () => {
        this.message.add({
          severity: 'info',
          summary: 'Cancelled',
          detail: 'Deletion has been cancelled.',
        });
      },
    });
  }
}
