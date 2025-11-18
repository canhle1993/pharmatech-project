import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../../services/contact.service';
import { firstValueFrom } from 'rxjs';
import { EditorModule } from 'primeng/editor';
import { ButtonModule } from 'primeng/button';

interface ImageMap {
  [key: string]: File | null;
}

interface PreviewMap {
  [key: string]: string;
}

@Component({
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, EditorModule, ButtonModule],
  selector: 'app-contact',
})
export class ContactComponent implements OnInit {
  contactForm: FormGroup;
  currentId: string = '';
  selectedImages: ImageMap = {};
  imagePreviews: PreviewMap = {};
  isUploading: boolean = false;

  constructor(private fb: FormBuilder, private contactService: ContactService) {
    this.initForm();
  }

  private initForm(): void {
    this.contactForm = this.fb.group({
      content: ['', Validators.required],
      bannerImage: [''],
      addresses: this.fb.array([]),
      phones: this.fb.array([]),
      emails: this.fb.array([]),
      mapUrl: [''],
    });
  }

  ngOnInit(): void {
    this.loadContactData();
  }

  get addresses(): FormArray {
    return this.contactForm.get('addresses') as FormArray;
  }

  get phones(): FormArray {
    return this.contactForm.get('phones') as FormArray;
  }

  get emails(): FormArray {
    return this.contactForm.get('emails') as FormArray;
  }

  addAddress(value: string = '') {
    this.addresses.push(this.fb.control(value));
  }

  removeAddress(index: number) {
    this.addresses.removeAt(index);
  }

  addPhone(value: string = '') {
    this.phones.push(this.fb.control(value));
  }

  removePhone(index: number) {
    this.phones.removeAt(index);
  }

  addEmail(value: string = '') {
    this.emails.push(this.fb.control(value));
  }

  removeEmail(index: number) {
    this.emails.removeAt(index);
  }

  async loadContactData() {
    try {
      const data = await firstValueFrom(this.contactService.getContact());
      if (data) {
        this.currentId = data._id || '';
        this.contactForm.patchValue({
          content: data.content || '',
          bannerImage: data.bannerImage || '',
          mapUrl: data.mapUrl || '',
        });

        // Clear existing arrays first
        this.addresses.clear();
        this.phones.clear();
        this.emails.clear();

        // Load addresses
        if (data.addresses && data.addresses.length > 0) {
          data.addresses.forEach((addr) => this.addAddress(addr));
        } else {
          this.addAddress();
        }

        // Load phones
        if (data.phones && data.phones.length > 0) {
          data.phones.forEach((phone) => this.addPhone(phone));
        } else {
          this.addPhone();
        }

        // Load emails
        if (data.emails && data.emails.length > 0) {
          data.emails.forEach((email) => this.addEmail(email));
        } else {
          this.addEmail();
        }
      } else {
        // Clear and initialize empty arrays
        this.addresses.clear();
        this.phones.clear();
        this.emails.clear();

        this.addAddress();
        this.addPhone();
        this.addEmail();
      }
    } catch (error) {
      console.error('Error loading contact data:', error);
      // Clear and initialize empty arrays on error
      this.addresses.clear();
      this.phones.clear();
      this.emails.clear();

      this.addAddress();
      this.addPhone();
      this.addEmail();
    }
  }

  onFileSelected(event: any, type: string) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImages[type] = file;
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews[type] = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  clearImage(type: string) {
    this.selectedImages[type] = null;
    this.imagePreviews[type] = '';
    if (type === 'banner') {
      this.contactForm.patchValue({ bannerImage: '' });
    }
  }

  buildImageUrl(path: string | undefined): string {
    if (!path) return '';
    if (path.startsWith('data:')) return path;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `http://localhost:3000${path}`;
  }

  async onSubmit() {
    if (this.contactForm.invalid) {
      alert('Please fill in all required fields');
      return;
    }

    this.isUploading = true;

    try {
      const formData = new FormData();

      // Append banner image file directly (not URL)
      if (this.selectedImages['banner']) {
        formData.append('bannerImage', this.selectedImages['banner']);
      }

      // Append other fields
      formData.append('content', this.contactForm.get('content')?.value);
      formData.append('mapUrl', this.contactForm.get('mapUrl')?.value || '');

      // Serialize arrays
      formData.append('addresses', JSON.stringify(this.addresses.value));
      formData.append('phones', JSON.stringify(this.phones.value));
      formData.append('emails', JSON.stringify(this.emails.value));

      // Submit
      if (this.currentId) {
        await firstValueFrom(
          this.contactService.updateContact(this.currentId, formData)
        );
        alert('Contact information updated successfully!');
      } else {
        const result = await firstValueFrom(
          this.contactService.createContact(formData)
        );
        this.currentId = result._id || '';
        alert('Contact information created successfully!');
      }

      // Clear selected images
      this.selectedImages = {};
      this.imagePreviews = {};

      // Reload data
      await this.loadContactData();
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Error saving contact information. Please try again.');
    } finally {
      this.isUploading = false;
    }
  }
}
