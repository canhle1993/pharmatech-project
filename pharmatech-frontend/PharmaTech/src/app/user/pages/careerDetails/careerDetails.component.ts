import { Component, OnInit, Renderer2, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CareerService } from '../../../services/career.service';
import { Career } from '../../../entities/career.entity';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ApplicationService } from '../../../services/application.service';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { Router } from '@angular/router';
import { AccountService } from '../../../services/account.service';

@Component({
  templateUrl: './careerDetails.component.html',
  imports: [CommonModule, RouterModule, ToastModule, DialogModule],
  providers: [DatePipe],
  styleUrls: ['./careerDetails.component.css'],
})
export class CareerDetailsComponent implements OnInit, AfterViewInit {
  career?: Career;
  loading = true;
  showMoreDesc = false;
  showMoreReq = false;
  showMoreInfo = false;
  benefitsView: string[] = [];
  similarJobs: Career[] = [];
  // Dialog resume missing
  showResumeDialog = false;

  // 🔹 fallback benefits (phòng trường hợp backend chưa có)
  private benefitsFallback: string[] = [
    'Health insurance',
    'Annual performance bonus',
    'Paid annual leave',
    'Professional training programs',
    'Overtime allowance',
    'Meal and transportation allowance',
    'Career advancement opportunities',
    'Friendly work environment',
    'Safety and hygiene equipment',
  ];

  constructor(
    private renderer: Renderer2,
    private route: ActivatedRoute,
    private careerService: CareerService,
    private appService: ApplicationService,
    private messageService: MessageService,
    private router: Router,
    private accountService: AccountService
  ) {}

  async ngOnInit() {
    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('id');
      if (id) {
        // fade out
        this.loading = true;
        await new Promise((res) => setTimeout(res, 150)); // delay nhẹ cho mượt hơn

        await this.loadCareer(id);
        await this.loadSimilarJobs(id);

        // fade in
        setTimeout(() => (this.loading = false), 100);
      }
    });
  }

  goToProfile() {
    this.showResumeDialog = false;

    const userId = localStorage.getItem('userId');
    if (!userId) return;

    this.router.navigate(['/profile', userId]);
  }

  /** 🧩 Dựng danh sách benefits đẹp */
  private buildBenefitsView() {
    const raw = (this.career?.benefits ?? []) as Array<
      string | { name?: string }
    >;
    const names = raw
      .map((b) => (typeof b === 'string' ? b : b?.name ?? ''))
      .filter(Boolean);

    this.benefitsView = names.length ? names : this.benefitsFallback;
  }

  /** 🔹 Gọi API lấy chi tiết job */
  async loadCareer(id: string) {
    try {
      const res = await this.careerService.findById(id);
      this.career = res as Career;
    } catch (err) {
      console.error('❌ Error', err);
    } finally {
      this.buildBenefitsView();
    }
  }

  /** ✔ CHECK job expired OR inactive */
  isExpired(): boolean {
    if (!this.career) return false;

    const now = new Date();
    const expiredDate =
      this.career.expiration_date &&
      new Date(this.career.expiration_date).getTime() < now.getTime();

    const inactive = this.career.is_active === false;

    return expiredDate || inactive;
  }
  /** 🟢 When user clicks "Apply Now" */
  /** 🟢 APPLY BUTTON LOGIC */
  async applyJob() {
    if (this.isExpired()) return;

    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Please login',
        detail: 'You must login to apply for this job.',
      });
      return;
    }

    // ⭐ Load latest user
    const freshUser = await this.accountService.findById(userId);
    localStorage.setItem('user', JSON.stringify(freshUser));

    // 1️⃣ CHECK DUPLICATE
    try {
      const check = await this.appService.checkDuplicate(
        userId,
        this.career?.id!
      );

      if (check.applied) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Already applied',
          detail: `You already applied for "${this.career?.title}".`,
        });
        return;
      }
    } catch (err) {
      console.error('❌ Duplicate check error:', err);
    }

    // 2️⃣ CHECK RESUME
    if (!freshUser.resume) {
      this.showResumeDialog = true;
      return;
    }

    // 3️⃣ SUBMIT APPLICATION
    try {
      this.loading = true;

      await this.appService.create({
        account_id: userId,
        career_id: this.career?.id,
        expected_salary: freshUser.expected_salary ?? null,
        available_from: freshUser.available_from ?? null,
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Application submitted',
        detail: `You have successfully applied for "${this.career?.title}".`,
      });
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to submit your application.',
      });
    } finally {
      this.loading = false;
    }
  }

  /** 🔹 Lấy 4 job tương tự (industry hoặc field) */
  private async loadSimilarJobs(id: string) {
    try {
      this.similarJobs = await this.careerService.findSimilarById(id);
    } catch (err) {
      console.error('❌ Error loading similar jobs', err);
      this.similarJobs = [];
    }
  }

  /** 🔹 Toggle xem thêm / thu gọn */
  toggle(section: 'desc' | 'req' | 'info') {
    if (section === 'desc') this.showMoreDesc = !this.showMoreDesc;
    if (section === 'req') this.showMoreReq = !this.showMoreReq;
    if (section === 'info') this.showMoreInfo = !this.showMoreInfo;
  }

  /** 🔹 Gắn lại CSS & JS cho template */
  ngAfterViewInit() {
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
      'https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700&display=swap';
    this.renderer.appendChild(document.head, fontLink);

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

  async saveJob() {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Login required',
        detail: 'Please login to save this job.',
      });
      return;
    }

    try {
      await this.careerService.saveJob(userId, this.career?.id!);

      this.messageService.add({
        severity: 'success',
        summary: 'Saved',
        detail: 'Job has been added to your saved list.',
      });
    } catch (err: any) {
      // Duplicate
      if (err?.error?.message === 'Job already saved') {
        this.messageService.add({
          severity: 'warn',
          summary: 'Already saved',
          detail: 'You already saved this job.',
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Could not save job.',
        });
      }
    }
  }
}
