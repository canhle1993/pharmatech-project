import { Component, OnInit, Renderer2, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  templateUrl: './auth.component.html',
  imports: [CommonModule, RouterOutlet],
})
export class AuthComponent implements OnInit, AfterViewInit {
  constructor(private renderer: Renderer2) {}
  ngOnInit() {}
  ngAfterViewInit() {
    // --- JS ---
    const jsFiles = [
      'assets/auth/js/form-utils.js',
      'assets/auth/js/script.js',
    ];
    jsFiles.forEach((src) => {
      const script = this.renderer.createElement('script');
      script.src = src;
      script.type = 'text/javascript';
      this.renderer.appendChild(document.body, script);
    });
  }
}
