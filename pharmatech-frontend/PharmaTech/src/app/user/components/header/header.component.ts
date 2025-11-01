import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [RouterLink, ButtonModule, CommonModule],
})
export class HeaderComponent implements OnInit {
  user: any = null;
  isLoggedIn = false;

  constructor(private accountService: AccountService, private router: Router) {}

  ngOnInit() {
    // 🔹 Giả sử token được lưu khi login
    this.isLoggedIn = !!localStorage.getItem('token');
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }
  }
  logout() {
    this.accountService.logout();
    localStorage.removeItem('token');
    this.isLoggedIn = false;
    this.router.navigate(['/auth/login']);
  }
}
