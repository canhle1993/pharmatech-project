import { Component, OnInit, AfterViewInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';        // ✅ thêm
import { ProgressSpinnerModule } from 'primeng/progressspinner'; // ✅ thêm
import { ToastModule } from 'primeng/toast'; 
import { MessageService } from 'primeng/api';
import { Account } from '../../../entities/account.entity';
import { AccountService } from '../../../services/account.service';


@Component({
  selector: 'app-profile',
  standalone: true,
    imports: [CommonModule, DatePipe, ProgressSpinnerModule, ToastModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  providers: [MessageService],
})
export class ProfileComponent implements OnInit, AfterViewInit {
  account: Account | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private accountService: AccountService,
    private messageService: MessageService,
    private renderer: Renderer2
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
  
    this.loading = true;
    try {
      const result = await this.accountService.findById(id);
  
      // ✅ Convert chuỗi ngày -> Date object
      ['last_login', 'created_at', 'updated_at'].forEach(field => {
        const val = (result as any)[field];
        if (typeof val === 'string' && val.includes('/')) {
          // đổi '30/10/2025 16:55' -> Date('2025-10-30T16:55')
          const [datePart, timePart] = val.split(' ');
          const [day, month, year] = datePart.split('/');
          (result as any)[field] = new Date(`${year}-${month}-${day}T${timePart || '00:00'}`);
        }
      });
  
      this.account = result;
    } catch (err) {
      console.error('❌ Lỗi khi lấy account:', err);
    } finally {
      this.loading = false;
    }
  }

  ngAfterViewInit() {
    // --- CSS ---
    const cssFiles = [
      'assets/css/vendor/bootstrap.min.css',
      'assets/css/vendor/lastudioicons.css',
      'assets/css/vendor/dliconoutline.css',
      'assets/css/animate.min.css',
      'assets/css/swiper-bundle.min.css',
      'assets/css/ion.rangeSlider.min.css',
      'assets/css/lightgallery-bundle.min.css',
      'assets/css/magnific-popup.css',
      'assets/css/style.css',
    ];
    cssFiles.forEach((href) => {
      const link = this.renderer.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      this.renderer.appendChild(document.head, link);
    });

    const fontLink = this.renderer.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href =
      'https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap';
    this.renderer.appendChild(document.head, fontLink);

    // --- JS ---
    const jsFiles = [
      'assets/js/vendor/modernizr-3.11.7.min.js',
      'assets/js/vendor/jquery-migrate-3.3.2.min.js',
      'assets/js/countdown.min.js',
      'assets/js/ajax.js',
      'assets/js/jquery.validate.min.js',
      'assets/js/vendor/jquery-3.6.0.min.js',
      'assets/js/vendor/bootstrap.bundle.min.js',
      'assets/js/swiper-bundle.min.js',
      'assets/js/ion.rangeSlider.min.js',
      'assets/js/lightgallery.min.js',
      'assets/js/jquery.magnific-popup.min.js',
      'assets/js/main.js',
    ];
    jsFiles.forEach((src) => {
      const script = this.renderer.createElement('script');
      script.src = src;
      script.type = 'text/javascript';
      this.renderer.appendChild(document.body, script);
    });
    
  }
  
}
