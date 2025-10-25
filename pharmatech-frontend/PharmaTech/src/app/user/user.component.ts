import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AccountService } from '../services/account.service';
@Component({
  templateUrl: './user.component.html',
  imports: [RouterLink, ButtonModule, RouterOutlet],
})
export class UserComponent implements OnInit {
  constructor(private accountService: AccountService, private router: Router) {}
  ngOnInit(): void {}
  logout() {
    this.accountService.logout();
    this.router.navigate(['/login']);
  }
}
