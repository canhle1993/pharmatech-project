import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  templateUrl: './home.component.html',
  imports: [RouterLink],
})
export class HomeComponent implements OnInit {
  ngOnInit(): void {}
}
