import { AfterViewInit, Component, OnInit, Renderer2 } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  imports: [RouterLink, ButtonModule, RouterLinkActive],
})
export class MenuComponent implements OnInit, AfterViewInit {
  constructor(private renderer: Renderer2) {}
  ngOnInit() {}

  ngAfterViewInit(): void {
    // --- CSS ---
    const cssFiles = [
      'assets/admin/vendor/fonts/boxicons.css',
      'assets/admin/vendor/css/core.css',
      'assets/admin/vendor/css/theme-default.css',
      'assets/admin/css/demo.css',
      'assets/admin/vendor/libs/perfect-scrollbar/perfect-scrollbar.css',
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

    // --- JS ---
    const jsFiles = [
      'assets/admin/vendor/js/helpers.js',
      'assets/admin/js/config.js',
      'assets/admin/vendor/libs/jquery/jquery.js',
      'assets/admin/vendor/libs/popper/popper.js',
      'assets/admin/vendor/js/bootstrap.js',
      'assets/admin/vendor/libs/perfect-scrollbar/perfect-scrollbar.js',
      'assets/admin/vendor/js/menu.js',
      'assets/admin/js/main.js',
      'https://buttons.github.io/buttons.js',
    ];
    jsFiles.forEach((src) => {
      const script = this.renderer.createElement('script');
      script.src = src;
      script.type = 'text/javascript';
      this.renderer.appendChild(document.body, script);
    });
  }
}
