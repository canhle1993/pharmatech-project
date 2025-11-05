import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
<<<<<<< HEAD
=======
import { HotlineData, HotlineService } from '../../../services/hotline.service';
import { CategoryService } from '../../../services/category.service'; // ✅ thêm dòng này
>>>>>>> origin/main

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [RouterLink, ButtonModule, CommonModule],
})
export class HeaderComponent implements OnInit {
<<<<<<< HEAD
  isLoggedIn = false;

  constructor(private accountService: AccountService, private router: Router) {}
=======
  user: any = null;
  isLoggedIn = false;
  categories: any[] = []; // ✅ thêm biến này

  hotlineData: HotlineData = {
    hotlineNumber: '(012) 345-6789',
    storeLocation: '6391 Elgin St. Celina, Delaware 10299',
  };

  constructor(
    private accountService: AccountService,
    private router: Router,
    private hotlineService: HotlineService,
    private categoryService: CategoryService // ✅ thêm vào constructor
  ) {}
>>>>>>> origin/main

  ngOnInit() {
    // 🔹 Giả sử token được lưu khi login
    this.isLoggedIn = !!localStorage.getItem('token');
<<<<<<< HEAD
=======
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }

    this.loadHotlineData();
    this.loadCategories(); // ✅ load danh mục
  }
  /** 🧾 Lấy danh sách category */
  async loadCategories() {
    try {
      const res: any = await this.categoryService.findAll();
      this.categories = Array.isArray(res) ? res : [];
    } catch (err) {
      console.error('❌ Load categories failed:', err);
    }
  }

  /** 🔁 Khi click category */
  goToCategory(categoryId: string) {
    this.router.navigate(['/shop'], { queryParams: { category: categoryId } });
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
      },
    });
>>>>>>> origin/main
  }
  logout() {
    this.accountService.logout();
    localStorage.removeItem('token');
    this.isLoggedIn = false;
    this.router.navigate(['/auth/login']);
  }
<<<<<<< HEAD
=======
  getPhoneHref(phoneNumber: string): string {
    return 'tel:' + phoneNumber.replace(/[^0-9]/g, '');
  }
>>>>>>> origin/main
}
