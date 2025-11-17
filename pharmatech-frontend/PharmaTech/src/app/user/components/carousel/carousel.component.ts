import { Component, OnInit } from '@angular/core';
import { BannerService, Banner } from '../../../services/banner.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
})
export class CarouselComponent implements OnInit {
  bannerData: Banner | null = null;
  slide1Url = '';
  slide2Url = '';
  slide3Url = '';

  constructor(private bannerService: BannerService) {}

  async ngOnInit() {
    await this.loadBanner();
  }

  async loadBanner() {
    try {
      const response = await firstValueFrom(this.bannerService.getBanner());
      this.bannerData = response.data;

      // Build full URLs for the images
      this.slide1Url = this.buildImageUrl(this.bannerData['slide1']) || 'assets/images/slider/slider-5-1.jpg';
      this.slide2Url = this.buildImageUrl(this.bannerData['slide2']) || 'assets/images/slider/slider-5-2.jpg';
      this.slide3Url = this.buildImageUrl(this.bannerData['slide3']) || 'assets/images/slider/slider-5-3.jpg';
    } catch (error) {
      console.error('Error loading banner:', error);
      // Fallback to default images
      this.slide1Url = 'assets/images/slider/slider-5-1.jpg';
      this.slide2Url = 'assets/images/slider/slider-5-2.jpg';
      this.slide3Url = 'assets/images/slider/slider-5-3.jpg';
    }
  }

  buildImageUrl(path: string | undefined): string {
    if (!path) return '';
    if (path.startsWith('data:')) return path;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('assets/')) return path;
    return `http://localhost:3000${path}`;
  }
}
