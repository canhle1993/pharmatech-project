import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AccountService } from '../services/account.service';
import { ButtonModule } from 'primeng/button';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
@Component({
  templateUrl: './admin.component.html',
  imports: [RouterOutlet, ButtonModule, HeaderComponent, FooterComponent],
})
export class AdminComponent implements OnInit {
  constructor(private accountService: AccountService, private router: Router) {}
  ngOnInit(): void {}
  logout() {
    this.accountService.logout();
    this.router.navigate(['/login']);
  }
}
