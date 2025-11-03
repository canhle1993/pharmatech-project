import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HotlineService, HotlineData } from '../../../../services/hotline.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './HotlineInfo.component.html',
  styleUrls: ['./HotlineInfo.component.css'],
})
export class HotlineInfoComponent implements OnInit {
  hotlineForm: FormGroup;
  isEditMode = false;
  hotlineId: string | null = null;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private fb: FormBuilder,
    private hotlineService: HotlineService
  ) {
    this.hotlineForm = this.fb.group({
      hotlineNumber: ['', [Validators.required]],
      storeLocation: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadHotlineData();
  }

  loadHotlineData(): void {
    this.hotlineService.getHotlineInfo().subscribe({
      next: (data: HotlineData) => {
        if (data && data._id) {
          this.isEditMode = true;
          this.hotlineId = data._id;
          this.hotlineForm.patchValue({
            hotlineNumber: data.hotlineNumber,
            storeLocation: data.storeLocation,
          });
        }
      },
      error: (error) => {
        console.log('No hotline data found, create mode enabled');
      }
    });
  }

  onSubmit(): void {
    if (this.hotlineForm.invalid) {
      this.showMessage('Please fill all required fields', 'error');
      return;
    }

    const formData: HotlineData = this.hotlineForm.value;

    if (this.isEditMode && this.hotlineId) {
      // Update existing
      this.hotlineService.updateHotlineInfo(this.hotlineId, formData).subscribe({
        next: (response) => {
          this.showMessage('Hotline information updated successfully!', 'success');
        },
        error: (error) => {
          this.showMessage('Failed to update hotline information', 'error');
          console.error(error);
        }
      });
    } else {
      // Create new
      this.hotlineService.createHotlineInfo(formData).subscribe({
        next: (response) => {
          this.isEditMode = true;
          this.hotlineId = response._id || null;
          this.showMessage('Hotline information created successfully!', 'success');
        },
        error: (error) => {
          this.showMessage('Failed to create hotline information', 'error');
          console.error(error);
        }
      });
    }
  }

  showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 3000);
  }
}
