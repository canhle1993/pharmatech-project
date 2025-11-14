// header.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../services/account.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [CommonModule, RouterModule],
})
export class HeaderComponent implements OnInit {
  user: any = null;
  currentTime = new Date();
  notifications: any[] = [];
  messages: any[] = [];

  constructor(
    private accountService: AccountService,
    private router: Router,
    private notifyService: NotificationService
  ) {}

  ngOnInit(): void {
    this.notifyService.notifications$.subscribe((list) => {
      this.notifications = list;
    });

    this.notifyService.messages$.subscribe((list) => {
      this.messages = list;
    });

    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) this.user = JSON.parse(storedUser);

    setInterval(() => (this.currentTime = new Date()), 1000);
  }

  logout() {
    this.accountService.logout();
    this.router.navigate(['/auth/login']);
  }
}
