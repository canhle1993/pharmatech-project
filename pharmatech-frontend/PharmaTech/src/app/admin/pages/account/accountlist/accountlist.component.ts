import { Component, OnInit } from '@angular/core';
import {
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Select } from 'primeng/select';
import { FloatLabel } from 'primeng/floatlabel';
import { Account } from '../../../../entities/account.entity';
import { AccountService } from '../../../../services/account.service';
import { Dialog } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { ToastModule } from 'primeng/toast';

@Component({
  templateUrl: './accountlist.component.html',
  styleUrls: ['./accountlist.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DatePipe,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    Select,
    FloatLabel,
    Dialog,
    AvatarModule,
    ReactiveFormsModule,
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
})
export class AccountListComponent implements OnInit {
  accounts: Account[] = [];
  loading = true;
  selectedRole: string | null = null;
  selectedStatus: boolean | null = null;
  createDialogVisible: boolean = false;
  registerForm!: FormGroup;

  newAdmin: Partial<Account> = {
    name: '',
    phone: '',
    username: '',
    email: '',
    password: '',
  };
  currentUserRoles: string[] = [];

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private confirmService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.buildForm();
    this.loadAccounts();

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.currentUserRoles = currentUser.roles || [];
  }
  canShowLockButton(target: Account): boolean {
    // Nếu đang login là SUPERADMIN
    if (this.currentUserRoles.includes('superadmin')) {
      // Chỉ hiển thị nút cho ADMIN và USER — KHÔNG cho superadmin khác
      return target.roles.includes('admin') || target.roles.includes('user');
    }

    // Nếu đang login là ADMIN
    if (this.currentUserRoles.includes('admin')) {
      // Chỉ thấy USER
      return target.roles.includes('user');
    }

    // User thường → không có quyền
    return false;
  }
  canShowEditButton(target: Account): boolean {
    // SUPERADMIN → chỉ thấy admin + user
    if (this.currentUserRoles.includes('superadmin')) {
      return target.roles.includes('admin') || target.roles.includes('user');
    }

    // ADMIN → chỉ thấy user
    if (this.currentUserRoles.includes('admin')) {
      return target.roles.includes('user');
    }

    // USER → không được edit ai hết
    return false;
  }

  private buildForm() {
    this.registerForm = this.fb.group(
      {
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(50),
            Validators.pattern(/^[A-Za-zÀ-Ỹà-ỹĂăÂâĐđÊêÔôƠơƯư\s]+$/),
          ],
        ],
        username: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(54),
            Validators.pattern(/^[a-zA-Z0-9_]+$/),
          ],
        ],
        email: ['', [Validators.required, Validators.email]],
        phone: [
          '',
          [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)],
        ],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(64),
            Validators.pattern(
              /^(?=\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
            ),
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  /** ✅ Kiểm tra password và confirmPassword */
  private passwordMatchValidator(group: FormGroup) {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;

    if (pass && confirm && pass !== confirm) {
      group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      group.get('confirmPassword')?.setErrors(null);
      return null;
    }
  }
  /** ✅ Danh sách filter cho vai trò và trạng thái */
  roleOptions = [
    { label: 'All Roles', value: null },
    { label: 'Admin', value: 'admin' },
    { label: 'User', value: 'user' },
    { label: 'Super Admin', value: 'superadmin' },
  ];

  statusOptions = [
    { label: 'All Status', value: null },
    { label: 'Active', value: true }, // boolean
    { label: 'Inactive', value: false }, // boolean
  ];

  /** ✅ Load danh sách account */
  async loadAccounts() {
    this.loading = true;
    try {
      const res: any = await this.accountService.findAll();
      this.accounts = res;
    } catch (err) {
      console.error(err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load accounts',
      });
    } finally {
      this.loading = false;
    }
  }

  /** ✅ Mở dialog thêm mới */
  openCreateDialog() {
    this.registerForm.reset();
    this.createDialogVisible = true;
  }

  /** ✅ Tạo tài khoản admin */
  async createAdminAccount() {
    console.log('🧩 Form valid:', this.registerForm.valid);
    console.log('🧩 Form value:', this.registerForm.value);

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      console.log('❌ Form errors:', this.registerForm.errors);
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill in all required fields correctly.',
      });
      return;
    }

    const { confirmPassword, ...formData } = this.registerForm.value;
    const payload = {
      ...formData,
      roles: ['admin'],
    };

    try {
      console.log('📤 Sending payload:', payload);
      const res: any = await this.accountService.createAdmin(payload);
      console.log('📥 Server response:', res);

      if (res && (res.id || res._id || res === true)) {
        // ✅ thêm điều kiện này
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Admin account created successfully!',
        });
        this.createDialogVisible = false;
        this.loadAccounts();
      } else {
        throw new Error('Create failed');
      }
    } catch (err: any) {
      console.error('🚨 Create admin error:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail:
          err?.error?.message ||
          err?.message ||
          'Failed to create admin account.',
      });
    }
  }

  /** ✅ Toggle lock/unlock */
  async toggleLock(account: Account) {
    const newStatus = !account.is_active;
    const actionText = newStatus ? 'unlock' : 'lock';

    this.confirmService.confirm({
      message: `Are you sure you want to ${actionText} the account "${account.name}"?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          account.loading = true;
          await this.accountService.updateStatus(account.id, newStatus);
          account.is_active = newStatus;
          this.messageService.add({
            severity: newStatus ? 'success' : 'warn',
            summary: 'Success',
            detail: `Account "${account.name}" has been ${actionText}ed successfully.`,
          });
        } catch (error) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to ${actionText} account "${account.name}".`,
          });
        } finally {
          account.loading = false;
        }
      },
    });
  }

  /** 🗑️ Soft Delete Account */
  async onSoftDelete(id: string, name: string) {
    this.confirmService.confirm({
      message: `Are you sure you want to delete the account "${name}"?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          this.loading = true;
          const res: any = await this.accountService.softDelete(id);
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail:
              res.msg || `Account "${name}" has been deleted successfully.`,
          });
          await this.loadAccounts(); // Refresh table
        } catch (err: any) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err?.error?.message ||
              `Failed to delete account "${name}". Please try again.`,
          });
        } finally {
          this.loading = false;
        }
      },
    });
  }

  /** ✅ Filter & Search */
  applyFilters(table: any) {
    let filtered = [...this.accounts];
    if (this.selectedRole) {
      filtered = filtered.filter((a) =>
        a.roles?.some(
          (r: string) => r.toLowerCase() === this.selectedRole!.toLowerCase()
        )
      );
    }
    if (this.selectedStatus !== null) {
      filtered = filtered.filter((a) => a.is_active === this.selectedStatus);
    }
    table.value = filtered;
  }

  onGlobalFilter(table: any, event: Event) {
    const input = event.target as HTMLInputElement;
    table.filterGlobal(input.value, 'contains');
  }
}
