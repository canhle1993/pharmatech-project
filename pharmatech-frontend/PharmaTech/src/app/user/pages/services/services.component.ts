import { AfterViewInit, Component, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { env } from '../../../enviroments/enviroment';

interface TabData {
  id: string;
  label: string;
  icon: string;
  content: SafeHtml;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css'],
})
export class ServicesComponent implements OnInit, AfterViewInit {
  activeTab: string = 'consulting';
  bannerImage: string = '';
  imageBase = env.imageUrl;

  tabs: TabData[] = [
    {
      id: 'consulting',
      label: 'Consulting',
      icon: 'fa-lightbulb',
      content: '',
    },
    {
      id: 'technical-support',
      label: 'Technical Support',
      icon: 'fa-headset',
      content: '',
    },
    {
      id: 'equipment-upgrade',
      label: 'Equipment Upgrade',
      icon: 'fa-tools',
      content: '',
    },
    { id: 'maintenance', label: 'Maintenance', icon: 'fa-wrench', content: '' },
  ];

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    // Load data from backend
    this.loadServiceData();

    // Get active tab from query params
    this.route.queryParams.subscribe((params) => {
      const tab = params['tab'];
      if (tab && this.tabs.some((t) => t.id === tab)) {
        this.activeTab = tab;
      }
    });
  }

  loadServiceData(): void {
    // Load content for each tab separately
    this.tabs.forEach((tab) => {
      this.http.get(`${env.baseUrl}service/${tab.id}`).subscribe({
        next: (data: any) => {
          if (data) {
            // Update banner from first loaded tab
            if (!this.bannerImage && data.bannerImage) {
              this.bannerImage = this.buildImageUrl(data.bannerImage);
            }

            // Set content for this specific tab
            tab.content = this.sanitizer.bypassSecurityTrustHtml(
              data.content || '<p>No content available for this section.</p>'
            );
          }
        },
        error: (error) => {
          console.error(`Error loading service data for ${tab.id}:`, error);
          tab.content = this.sanitizer.bypassSecurityTrustHtml(
            '<p>Error loading content.</p>'
          );
        },
      });
    });

    // Set default banner if none loaded
    if (!this.bannerImage) {
      this.bannerImage = 'assets/images/bg/Pharma-Natural.jpg';
    }
  }

  selectTab(tabId: string): void {
    this.activeTab = tabId;
    // Update URL without reloading page
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabId },
      queryParamsHandling: 'merge',
    });
  }

  isActive(tabId: string): boolean {
    return this.activeTab === tabId;
  }

  buildImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${this.imageBase}${imagePath}`;
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
