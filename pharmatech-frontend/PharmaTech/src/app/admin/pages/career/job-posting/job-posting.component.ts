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
  selector: 'app-job-posting',
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
    });
    this.bannerFileEdit = null;
    this.displayEditDialog = true;
  }

  /** Select banner file */
  onFileSelect(event: any, type: 'add' | 'edit') {
    const file = event.target.files[0];
    if (file) {
      if (type === 'add') {
        this.bannerFileAdd = file;
        this.addForm.patchValue({ banner: file.name });
      } else {
        this.bannerFileEdit = file;
        this.editForm.patchValue({ banner: file.name });
      }
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
