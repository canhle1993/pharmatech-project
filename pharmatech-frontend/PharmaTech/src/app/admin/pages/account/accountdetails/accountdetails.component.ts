import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';        // ✅ thêm
import { ProgressSpinnerModule } from 'primeng/progressspinner'; // ✅ thêm
import { ToastModule } from 'primeng/toast'; 
import { MessageService } from 'primeng/api';
import { Account } from '../../../../entities/account.entity';
import { AccountService } from '../../../../services/account.service';

@Component({
  selector: 'app-accountdetails',
  standalone: true,
    imports: [CommonModule, DatePipe, ProgressSpinnerModule, ToastModule],
  templateUrl: './accountdetails.component.html',
  styleUrls: ['./accountdetails.component.css'],
  providers: [MessageService],
})
export class AccountDetailsComponent implements OnInit {
  account: Account | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private accountService: AccountService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
  
    this.loading = true;
    try {
      const result = await this.accountService.findById(id);
  
      // ✅ Convert chuỗi ngày -> Date object
      ['last_login', 'created_at', 'updated_at'].forEach(field => {
        const val = (result as any)[field];
        if (typeof val === 'string' && val.includes('/')) {
          // đổi '30/10/2025 16:55' -> Date('2025-10-30T16:55')
          const [datePart, timePart] = val.split(' ');
          const [day, month, year] = datePart.split('/');
          (result as any)[field] = new Date(`${year}-${month}-${day}T${timePart || '00:00'}`);
        }
      });
  
      this.account = result;
    } catch (err) {
      console.error('❌ Lỗi khi lấy account:', err);
    } finally {
      this.loading = false;
    }
  }
  
}
