import { Component, OnInit, Renderer2, AfterViewInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [ButtonModule, RouterLink, CommonModule],
})
export class HeaderComponent implements OnInit {
  user: any = null;
  currentTime = new Date();

  constructor(
    private accountService: AccountService,
    private router: Router,
    private renderer: Renderer2
  ) {}
  ngOnInit() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }

    setInterval(() => (this.currentTime = new Date()), 1000);
  }

  logout() {
    this.accountService.logout();
    this.router.navigate(['/auth/login']);
  }
}
