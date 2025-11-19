import { AfterViewInit, Component, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AboutService } from '../../../services/about.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class AboutUsComponent implements OnInit {
  about: any;

  constructor(
    private aboutService: AboutService,
    private sanitizer: DomSanitizer,
    private renderer: Renderer2
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadAssets(); // ⬅️ await để chắc JS đã sẵn sàng

    this.aboutService.getAbout().subscribe((data: any) => {
      this.about = data;
    });
  }

  getYouTubeEmbedUrl(url: string | undefined): SafeResourceUrl | null {
    if (!url) return null;

    let videoId = '';

    // Extract video ID from various YouTube URL formats
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    }

    if (!videoId) return null;

    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
  private async loadAssets() {
    const addCss = (href: string) =>
      new Promise<void>((resolve) => {
        const link = this.renderer.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => resolve();
        this.renderer.appendChild(document.head, link);
      });

    const addJs = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const s = this.renderer.createElement('script');
        s.src = src;
        s.type = 'text/javascript';
        s.onload = () => resolve();
        s.onerror = (e: any) => reject(e);
        this.renderer.appendChild(document.body, s);
      });

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
    for (const href of cssFiles) await addCss(href);

    // ✅ BẮT BUỘC: jQuery trước, rồi mới các script khác
    await addJs('assets/js/vendor/jquery-3.6.0.min.js');
    await addJs('assets/js/vendor/jquery-migrate-3.3.2.min.js');
    await addJs('assets/js/vendor/bootstrap.bundle.min.js');
    await addJs('assets/js/countdown.min.js');
    await addJs('assets/js/ajax.js');
    await addJs('assets/js/jquery.validate.min.js');
    await addJs('assets/js/swiper-bundle.min.js');
    await addJs('assets/js/ion.rangeSlider.min.js');
    await addJs('assets/js/lightgallery.min.js');
    await addJs('assets/js/jquery.magnific-popup.min.js');
    await addJs('assets/js/main.js');
  }
}
