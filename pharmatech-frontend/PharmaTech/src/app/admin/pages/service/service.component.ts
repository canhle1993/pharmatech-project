import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { EditorModule } from 'primeng/editor';
import { ButtonModule } from 'primeng/button';
import { env } from '../../../enviroments/enviroment';

@Component({
  selector: 'app-service-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EditorModule, ButtonModule],
  templateUrl: './service.component.html',
  styleUrls: ['./service.component.css']
})
export class ServiceAdminComponent implements OnInit {
  serviceForm!: FormGroup;
  selectedImage: File | null = null;
  imagePreview: string = '';
  isUploading = false;
  imageBase = env.imageUrl;

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadServiceData();
  }

  initializeForm(): void {
    this.serviceForm = this.fb.group({
      bannerImage: [''],
      content: ['']
    });
  }

  loadServiceData(): void {
    this.http.get(`${env.baseUrl}service`).subscribe({
      next: (data: any) => {
        if (data) {
          this.serviceForm.patchValue({
            bannerImage: data.bannerImage || '',
            content: data.content || ''
          });
        }
      },
      error: (error) => {
        console.error('Error loading service data:', error);
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  clearImage(): void {
    this.selectedImage = null;
    this.imagePreview = '';
  }

  buildImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${this.imageBase}${imagePath}`;
  }

  onSubmit(): void {
    if (this.serviceForm.invalid) return;

    this.isUploading = true;
    const formData = new FormData();

    const formValue = this.serviceForm.value;

    if (this.selectedImage) {
      formData.append('images', this.selectedImage, 'bannerImage');
    }

    formData.append('content', formValue.content || '');

    if (!this.selectedImage && formValue.bannerImage) {
      formData.append('bannerImage', formValue.bannerImage);
    }

    this.http.post(`${env.baseUrl}service`, formData).subscribe({
      next: (response) => {
        console.log('Service updated successfully:', response);
        this.isUploading = false;
        alert('Service content updated successfully!');
        this.loadServiceData();
      },
      error: (error) => {
        console.error('Error updating service:', error);
        this.isUploading = false;
        alert('Error updating service content. Please try again.');
      }
    });
  }
}
