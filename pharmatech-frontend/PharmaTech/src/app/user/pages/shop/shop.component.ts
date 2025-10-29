import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  templateUrl: './shop.component.html',
  imports: [RouterLink],
})
export class ShopComponent implements OnInit {
  ngOnInit(): void {}
}
