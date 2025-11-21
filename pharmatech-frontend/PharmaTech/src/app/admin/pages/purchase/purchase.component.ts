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
  selector: 'app-purchase-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EditorModule, ButtonModule, ToastModule],
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.css']
  ,providers: [MessageService]
})
export class PurchaseAdminComponent implements OnInit {
  purchaseForm!: FormGroup;
  selectedImage: File | null = null;
  imagePreview: string = '';
  isUploading = false;
  imageBase = env.imageUrl;

  constructor(private fb: FormBuilder, private http: HttpClient, private messageService: MessageService) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadPurchaseData();
  }

  initializeForm(): void {
    this.purchaseForm = this.fb.group({
      bannerImage: [''],
      content: ['']
    });
  }

  loadPurchaseData(): void {
    this.http.get(`${env.baseUrl}purchase`).subscribe({
      next: (data: any) => {
        if (data) {
          this.purchaseForm.patchValue({
            bannerImage: data.bannerImage || '',
            content: data.content || ''
          });
        }
      },
      error: (error) => {
        console.error('Error loading purchase data:', error);
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
    if (this.purchaseForm.invalid) return;

    this.isUploading = true;
    const formData = new FormData();

    const formValue = this.purchaseForm.value;

    if (this.selectedImage) {
      formData.append('images', this.selectedImage, 'bannerImage');
    }

    formData.append('content', formValue.content || '');

    if (!this.selectedImage && formValue.bannerImage) {
      formData.append('bannerImage', formValue.bannerImage);
    }

    this.http.post(`${env.baseUrl}purchase`, formData).subscribe({
      next: (response) => {
        console.log('Purchase updated successfully:', response);
        this.isUploading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Updated',
          detail: 'Purchase content updated successfully'
        });
        this.loadPurchaseData();
      },
      error: (error) => {
        console.error('Error updating purchase:', error);
        this.isUploading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Error updating purchase content. Please try again.'
        });
      }
    });
  }
}
