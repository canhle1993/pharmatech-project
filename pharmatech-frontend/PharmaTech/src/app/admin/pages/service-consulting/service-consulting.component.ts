import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { EditorModule } from 'primeng/editor';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { env } from '../../../enviroments/enviroment';

@Component({
  selector: 'app-service-consulting',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EditorModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './service-consulting.component.html',
  styleUrls: ['./service-consulting.component.css'],
})
export class ServiceConsultingComponent implements OnInit {
  serviceForm!: FormGroup;
  selectedImage: File | null = null;
  imagePreview: string = '';
  isUploading = false;
  imageBase = env.imageUrl;
  pageName = 'consulting';

  constructor(private fb: FormBuilder, private http: HttpClient, private messageService: MessageService) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadServiceData();
  }

  initializeForm(): void {
    this.serviceForm = this.fb.group({
      bannerImage: [''],
      content: [''],
    });
  }

  loadServiceData(): void {
    this.http.get(`${env.baseUrl}service/${this.pageName}`).subscribe({
      next: (data: any) => {
        if (data) {
          this.serviceForm.patchValue({
            bannerImage: data.bannerImage || '',
            content: data.content || '',
          });
        }
      },
      error: (error) => {
        console.error('Error loading service data:', error);
      },
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

  buildImageUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${this.imageBase}${path}`;
  }

  onSubmit(): void {
    if (this.serviceForm.invalid) {
      return;
    }

    this.isUploading = true;
    const formValue = this.serviceForm.value;
    const formData = new FormData();

    // Add page identifier
    formData.append('page', this.pageName);

    // Add file if selected
    if (this.selectedImage) {
      formData.append('images', this.selectedImage, 'bannerImage');
    }

    // Add content
    formData.append('content', formValue.content || '');

    console.log('=== SUBMITTING TO BACKEND ===');
    console.log('URL:', `${env.baseUrl}service`);
    console.log('Page:', this.pageName);
    console.log('Content length:', (formValue.content || '').length);
    console.log('Has image:', !!this.selectedImage);

    this.http.post(`${env.baseUrl}service`, formData).subscribe({
      next: (response) => {
        this.isUploading = false;
        console.log('Success response:', response);
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Content updated successfully.'
        });
        this.loadServiceData();
      },
      error: (error) => {
        this.isUploading = false;
        console.error('=== ERROR FROM BACKEND ===');
        console.error('Error object:', error);
        console.error('Status:', error.status);
        console.error('Status text:', error.statusText);
        console.error('Error message:', error.message);
        console.error('Error details:', error.error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Update failed: ${error.message || 'Please try again.'}`
        });
      },
    });
  }
}
