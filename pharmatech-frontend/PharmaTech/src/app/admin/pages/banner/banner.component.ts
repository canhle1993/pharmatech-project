import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BannerService, Banner } from '../../../services/banner.service';
import { ButtonModule } from 'primeng/button';
import { firstValueFrom } from 'rxjs';

interface ImageMap {
  [key: string]: File | null;
}

interface PreviewMap {
  [key: string]: string | null;
}

@Component({
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css'],
  standalone: true,
  imports: [CommonModule, ButtonModule],
})
export class BannerComponent implements OnInit {
  // Files selected by admin
  selectedImages: ImageMap = {
    slide1: null,
    slide2: null,
    slide3: null,
  };

  // Base64 previews for quick visual feedback
  imagePreviews: PreviewMap = {
    slide1: null,
    slide2: null,
    slide3: null,
  };

  // Existing banner data from backend
  currentBanner: Banner | null = null;

  isUploading = false;

  constructor(private bannerService: BannerService) {}

  async ngOnInit() {
    await this.loadBanner();
  }

  async loadBanner() {
    try {
      const response = await firstValueFrom(this.bannerService.getBanner());
      this.currentBanner = response.data;

      // Set previews for existing images
      if (this.currentBanner['slide1']) {
        this.imagePreviews['slide1'] = this.buildImageUrl(this.currentBanner['slide1']);
      }
      if (this.currentBanner['slide2']) {
        this.imagePreviews['slide2'] = this.buildImageUrl(this.currentBanner['slide2']);
      }
      if (this.currentBanner['slide3']) {
        this.imagePreviews['slide3'] = this.buildImageUrl(this.currentBanner['slide3']);
      }
    } catch (error) {
      console.error('Error loading banner:', error);
    }
  }

  buildImageUrl(path: string | undefined): string {
    if (!path) return '';
    if (path.startsWith('data:')) return path;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `http://localhost:3000${path}`;
  }

  onFileSelected(event: any, key: 'slide1' | 'slide2' | 'slide3') {
    const file: File | undefined = event?.target?.files?.[0];
    if (!file) return;

    // Optional: basic dimension validation for hero banners
    const img = new Image();
    img.onload = () => {
      // Recommend 1920x720 but allow any size (just warn)
      if (img.width !== 1920 || img.height !== 720) {
        console.warn(`Image ${key} is ${img.width}x${img.height}. Recommended: 1920x720.`);
      }

      this.selectedImages[key] = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews[key] = e.target.result as string;
      };
      reader.readAsDataURL(file);
    };
    img.src = URL.createObjectURL(file);
  }

  clearImage(key: 'slide1' | 'slide2' | 'slide3') {
    this.selectedImages[key] = null;
    this.imagePreviews[key] = null;
  }

  // Placeholder save handler; wire to backend service later
  async save() {
    try {
      this.isUploading = true;
      const payload = new FormData();

      if (this.selectedImages['slide1']) payload.append('images', this.selectedImages['slide1']);
      if (this.selectedImages['slide2']) payload.append('images', this.selectedImages['slide2']);
      if (this.selectedImages['slide3']) payload.append('images', this.selectedImages['slide3']);

      await firstValueFrom(this.bannerService.updateBanner(payload));

      alert('Banner images updated successfully!');

      // Clear selected files and reload
      this.selectedImages = { slide1: null, slide2: null, slide3: null };
      await this.loadBanner();
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Failed to save banner images. Please try again.');
    } finally {
      this.isUploading = false;
    }
  }
}
