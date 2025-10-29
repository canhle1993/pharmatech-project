import { Component, OnInit } from '@angular/core';
import { Table } from 'primeng/table';
import { FormsModule } from '@angular/forms';
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
  ],
  providers: [ConfirmationService, MessageService],
})
export class AccountListComponent implements OnInit {
  accounts: Account[] = [];
  loading = true;
  selectedRole: string | null = null;
  selectedStatus: boolean | null = null;
  constructor(
    private accountService: AccountService,
    private confirmService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadAccounts();
  }

  roleOptions = [
    { label: 'All Roles', value: null },
    { label: 'Admin', value: 'admin' },
    { label: 'User', value: 'user' },
    { label: 'Super Admin', value: 'superadmin' },
  ];

  statusOptions = [
    { label: 'All Status', value: null },
    { label: 'Active', value: true }, // ✅ boolean
    { label: 'Inactive', value: false }, // ✅ boolean
  ];

  applyFilters(table: any) {
    // Start from the full dataset
    let filtered = [...this.accounts];

    // Filter by Role (only if selected)
    if (this.selectedRole) {
      filtered = filtered.filter((a) =>
        a.roles?.some(
          (r: string) => r.toLowerCase() === this.selectedRole!.toLowerCase()
        )
      );
    }

    // Filter by Status (only if selected)
    if (this.selectedStatus !== null) {
      filtered = filtered.filter((a) => a.is_active === this.selectedStatus);
    }

    // ✅ Always assign new filtered data to table.value
    table.value = filtered;
  }

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

  clear(table: Table) {
    table.clear();
    // Tìm ô input search và reset value
    const searchInput = document.querySelector(
      'input[pinputtext]'
    ) as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
    }
  }

  reload() {
    this.loadAccounts();
  }

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

  onGlobalFilter(table: any, event: Event) {
    const input = event.target as HTMLInputElement;
    table.filterGlobal(input.value, 'contains');
  }
}
