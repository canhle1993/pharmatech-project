import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  templateUrl: './auth.component.html',
  imports: [CommonModule, RouterOutlet],
})
export class AuthComponent implements OnInit {
  ngOnInit(): void {}
}
