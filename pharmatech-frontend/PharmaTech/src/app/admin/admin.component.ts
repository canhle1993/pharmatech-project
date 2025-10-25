import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AccountService } from '../services/account.service';
import { ButtonModule } from 'primeng/button';
@Component({
  templateUrl: './admin.component.html',
  imports: [RouterLink, RouterOutlet, ButtonModule],
})
export class AdminComponent implements OnInit {
  constructor(private accountService: AccountService, private router: Router) {}
  ngOnInit(): void {}
  logout() {
    this.accountService.logout();
    this.router.navigate(['/login']);
  }
}
