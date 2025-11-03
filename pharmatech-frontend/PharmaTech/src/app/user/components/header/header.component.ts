import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { HotlineService, HotlineData } from '../../../services/hotline.service';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [RouterLink, ButtonModule, CommonModule],
})
export class HeaderComponent implements OnInit {
  isLoggedIn = false;
  hotlineData: HotlineData = {
    hotlineNumber: '(012) 345-6789',
    storeLocation: '6391 Elgin St. Celina, Delaware 10299'
  };

  constructor(
    private accountService: AccountService,
    private router: Router,
    private hotlineService: HotlineService
  ) {}

  ngOnInit() {
    // 🔹 Giả sử token được lưu khi login
    this.isLoggedIn = !!localStorage.getItem('token');
    this.loadHotlineData();
  }

  loadHotlineData(): void {
    this.hotlineService.getHotlineInfo().subscribe({
      next: (data: HotlineData) => {
        if (data) {
          this.hotlineData = data;
        }
      },
      error: (error) => {
        console.log('Using default hotline data');
      }
    });
  }

  logout() {
    this.accountService.logout();
    localStorage.removeItem('token');
    this.isLoggedIn = false;
    this.router.navigate(['/auth/login']);
  }

  getPhoneHref(phoneNumber: string): string {
    return 'tel:' + phoneNumber.replace(/[^0-9]/g, '');
  }
}
