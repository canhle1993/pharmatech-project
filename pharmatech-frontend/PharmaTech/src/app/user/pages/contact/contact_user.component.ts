import { AfterViewInit, Component, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ContactService, ContactData } from '../../../services/contact.service';
import { firstValueFrom } from 'rxjs';

@Component({
  templateUrl: './contact_user.component.html',
  standalone: true,
  imports: [CommonModule],
  selector: 'app-contact-user',
})
export class ContactUserComponent implements OnInit, AfterViewInit {
  contact: ContactData | null = null;
  safeMapUrl: SafeResourceUrl;
  defaultMapUrl =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2136.986005919501!2d-73.9685579655238!3d40.75862446708152!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c258e4a1c884e5%3A0x24fe1071086b36d5!2sThe%20Atrium!5e0!3m2!1sen!2sbd!4v1585132512970!5m2!1sen!2sbd';

  constructor(
    private contactService: ContactService,
    private sanitizer: DomSanitizer,
    private renderer: Renderer2
  ) {
    // Initialize with default map URL
    this.safeMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.defaultMapUrl
    );
  }

  ngOnInit(): void {
    this.loadContactData();
  }

  async loadContactData() {
    try {
      this.contact = await firstValueFrom(this.contactService.getContact());
      // Update map URL if exists
      if (this.contact?.mapUrl) {
        this.safeMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          this.contact.mapUrl
        );
      }
    } catch (error) {
      console.error('Error loading contact data:', error);
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
