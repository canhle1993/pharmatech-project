import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FloatLabel } from 'primeng/floatlabel';
import { Select } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { DepositSettingService } from '../../../../services/deposit-setting.service';
import { DepositSetting } from '../../../../entities/deposit-setting.entity';

@Component({
  templateUrl: './depositSettingList.component.html',
  styleUrls: ['./depositSettingList.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    Dialog,
    InputTextModule,
    InputNumberModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    Select,
    IconFieldModule,
    InputIconModule,
  ],
  providers: [ConfirmationService, MessageService],
})
export class DepositSettingListComponent implements OnInit {
  depositSettings: DepositSetting[] = [];
  loading = true;

  dialogVisible = false;
  isEditMode = false;
  depositForm!: FormGroup;
  selectedSetting: DepositSetting | null = null;

  selectedStatus: string | null = null;
  statusFilterOptions = [
    { label: 'All', value: null },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];
  filteredDepositSettings: DepositSetting[] = [];

  statusOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];

  constructor(
    private fb: FormBuilder,
    private depositService: DepositSettingService,
    private confirmService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadSettings();
  }

  private buildForm() {
    this.depositForm = this.fb.group({
      min_total: [0, [Validators.required, Validators.min(0)]],
      max_total: [0, [Validators.required, Validators.min(0)]],
      percent: [
        0,
        [Validators.required, Validators.min(1), Validators.max(100)],
      ],
      is_active: [true, Validators.required],
    });
  }

  async loadSettings() {
    this.loading = true;
    try {
      const res: any = await this.depositService.findAll();
      this.depositSettings = res || [];
      this.filteredDepositSettings = [...this.depositSettings];
    } catch (err) {
      console.error('❌ Load deposit settings error:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load deposit settings.',
      });
    } finally {
      this.loading = false;
    }
  }
  applyFilterByStatus() {
    if (!this.selectedStatus) {
      this.filteredDepositSettings = [...this.depositSettings];
    } else if (this.selectedStatus === 'active') {
      this.filteredDepositSettings = this.depositSettings.filter(
        (s) => s.is_active === true
      );
    } else if (this.selectedStatus === 'inactive') {
      this.filteredDepositSettings = this.depositSettings.filter(
        (s) => s.is_active === false
      );
    }
  }

  // ================== ADD / EDIT ==================
  openCreateDialog() {
    this.isEditMode = false;
    this.selectedSetting = null;
    this.depositForm.reset({
      min_total: 0,
      max_total: 0,
      percent: 0,
      is_active: true,
    });
    this.dialogVisible = true;
  }

  openEditDialog(setting: DepositSetting) {
    this.isEditMode = true;
    this.selectedSetting = setting;
    this.depositForm.patchValue({
      min_total: setting.min_total,
      max_total: setting.max_total,
      percent: setting.percent,
      is_active: setting.is_active,
    });
    this.dialogVisible = true;
  }

  // ================== SAVE ==================
  async saveDepositSetting() {
    if (this.depositForm.invalid) {
      this.depositForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill all required fields correctly.',
      });
      return;
    }

    const formValue = this.depositForm.value;
    const min = Number(formValue.min_total);
    const max = Number(formValue.max_total);
    const percent = Number(formValue.percent);

    // 🔸 Kiểm tra range logic trước
    if (min >= max) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Range',
        detail: 'Min total must be less than Max total.',
      });
      return;
    }

    // 🔸 Kiểm tra overlap FE trước khi gọi API
    const conflict = this.depositSettings
      .filter(
        (s) => !this.isEditMode || s.id !== this.selectedSetting?.id // bỏ qua chính nó
      )
      .find((s) => !(max < s.min_total || min > s.max_total));

    if (conflict) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Overlap Detected',
        detail: `Range overlaps existing setting [${conflict.min_total} – ${conflict.max_total}] (${conflict.percent}%).`,
      });
      return;
    }

    try {
      if (this.isEditMode && this.selectedSetting) {
        const payload = { ...formValue, id: this.selectedSetting.id };
        await this.depositService.update(payload);
        this.messageService.add({
          severity: 'success',
          summary: 'Updated',
          detail: 'Deposit setting updated successfully.',
        });
      } else {
        await this.depositService.create(formValue);
        this.messageService.add({
          severity: 'success',
          summary: 'Created',
          detail: 'Deposit setting created successfully.',
        });
      }

      this.dialogVisible = false;
      await this.loadSettings();
    } catch (err: any) {
      console.error('❌ Save deposit setting error:', err);
      const backendMsg =
        err?.error?.message ||
        err?.message ||
        'Failed to save deposit setting. Please try again.';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: backendMsg,
      });
    }
  }

  // ================== DELETE ==================
  async onDelete(setting: DepositSetting) {
    this.confirmService.confirm({
      message: `Are you sure you want to delete this setting (${setting.percent}% for ${setting.min_total} - ${setting.max_total})?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const currentUser = JSON.parse(
            localStorage.getItem('currentUser') || '{}'
          );
          const updated_by = currentUser?.name || 'admin';
          await this.depositService.softDelete(setting.id!, updated_by);
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Deposit setting deleted successfully.',
          });
          await this.loadSettings();
        } catch (err) {
          console.error('❌ Delete deposit setting error:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete deposit setting.',
          });
        }
      },
    });
  }
}
