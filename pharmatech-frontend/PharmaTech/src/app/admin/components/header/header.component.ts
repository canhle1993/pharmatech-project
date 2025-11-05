import { Component, OnInit, Renderer2, AfterViewInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { ButtonModule } from 'primeng/button';
<<<<<<< HEAD
=======
import { CommonModule } from '@angular/common';
>>>>>>> origin/main

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
<<<<<<< HEAD
  imports: [ButtonModule, RouterLink],
})
export class HeaderComponent implements OnInit {
  user: any = null;

  constructor(private accountService: AccountService, private router: Router, private renderer: Renderer2) {}
=======
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
>>>>>>> origin/main
  ngOnInit() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }
<<<<<<< HEAD
  }
 
=======

    setInterval(() => (this.currentTime = new Date()), 1000);
  }
>>>>>>> origin/main

  logout() {
    this.accountService.logout();
    this.router.navigate(['/auth/login']);
  }
}
