import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  imports: [RouterLink, ButtonModule],
})
export class HeaderComponent implements OnInit {
  constructor(private accountService: AccountService, private router: Router) {}
  ngOnInit() {}
  logout() {
    this.accountService.logout();
    this.router.navigate(['/auth/login']);
  }
}
