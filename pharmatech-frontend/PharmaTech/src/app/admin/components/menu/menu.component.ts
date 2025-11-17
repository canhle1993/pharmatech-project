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
    // ==========================
    //  1) Tự tạo toggle cho menu
    // ==========================

    const menuToggles = document.querySelectorAll('.menu-toggle');

    menuToggles.forEach((toggle: any) => {
      this.renderer.listen(toggle, 'click', () => {
        const parent = toggle.parentElement;

        // Nếu đang mở thì đóng
        if (parent.classList.contains('open')) {
          parent.classList.remove('open');
        } else {
          // Đóng tất cả cái khác
          document
            .querySelectorAll('.menu-item.open')
            .forEach((item) => item.classList.remove('open'));

          // Mở cái đang click
          parent.classList.add('open');
        }
      });
    });
  }
}
