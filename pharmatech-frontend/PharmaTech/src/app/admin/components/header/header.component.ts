import { Component, OnInit, Renderer2, AfterViewInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  imports: [ButtonModule, RouterLink],
})
export class HeaderComponent implements OnInit {
  user: any = null;

  constructor(private accountService: AccountService, private router: Router, private renderer: Renderer2) {}
  ngOnInit() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }
  }
 

  logout() {
    this.accountService.logout();
    this.router.navigate(['/auth/login']);
  }
}
