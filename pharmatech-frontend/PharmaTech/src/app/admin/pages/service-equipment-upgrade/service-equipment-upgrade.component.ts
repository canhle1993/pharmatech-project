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
  selector: 'app-service-equipment-upgrade',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EditorModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './service-equipment-upgrade.component.html',
  styleUrls: ['./service-equipment-upgrade.component.css'],
})
export class ServiceEquipmentUpgradeComponent implements OnInit {
  form!: FormGroup;
  selectedImage: File | null = null;
  imagePreview: string = '';
  isUploading = false;
  imageBase = env.imageUrl;
  pageName = 'equipment-upgrade';
  apiEndpoint = 'service';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
  }

  initializeForm(): void {
    this.form = this.fb.group({
      bannerImage: [''],
      content: [''],
    });
  }

  loadData(): void {
    this.http
      .get(`${env.baseUrl}${this.apiEndpoint}/${this.pageName}`)
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.form.patchValue({
              bannerImage: data.bannerImage || '',
              content: data.content || '',
            });
          }
        },
        error: (error) => {
          console.error('Error loading data:', error);
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
    if (this.form.invalid) {
      return;
    }

    this.isUploading = true;
    const formValue = this.form.value;
    const formData = new FormData();

    formData.append('page', this.pageName);

    if (this.selectedImage) {
      formData.append('images', this.selectedImage, 'bannerImage');
    }

    formData.append('content', formValue.content || '');

    this.http.post(`${env.baseUrl}${this.apiEndpoint}`, formData).subscribe({
      next: (response) => {
        this.isUploading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Content updated successfully.',
        });
        this.loadData();
      },
      error: (error) => {
        this.isUploading = false;
        console.error('Error updating:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating content. Please try again.',
        });
      },
    });
  }
}
