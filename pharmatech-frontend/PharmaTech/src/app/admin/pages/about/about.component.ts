import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AboutService } from '../../../services/about.service';
import { firstValueFrom } from 'rxjs'; // <-- thêm import

interface ImageMap {
  [key: string]: File | null;
}

interface PreviewMap {
  [key: string]: string;
}

@Component({
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  selector: 'app-about',
})
export class AboutComponent implements OnInit {
  aboutForm: FormGroup;
  currentId: string = '';
  selectedImages: ImageMap = {};
  imagePreviews: PreviewMap = {};
  isUploading: boolean = false;

  constructor(private fb: FormBuilder, private aboutService: AboutService) {
    this.initForm();
  }

  private initForm(): void {
    this.aboutForm = this.fb.group({
      content: ['', Validators.required],
      bannerImage: [''],
      intro: this.fb.group({
        subtitle: [''],
        title: [''],
        paragraph1: [''],
        paragraph2: [''],
        signatureImage: [''],
        image: [''],
      }),
      cta: this.fb.group({
        backgroundImage: [''],
        videoUrl: [''],
      }),
      open: this.fb.group({
        subtitle: [''],
        title: [''],
        text: [''],
        image: [''],
      }),
      schedule: this.fb.group({
        monFri: [''],
        satSun: [''],
      }),
      teamSection: this.fb.group({
        title: [''],
      }),
      testimonialsSection: this.fb.group({
        title: [''],
        bgColor: [''],
      }),
      team: this.fb.array([]),
      testimonials: this.fb.array([]),
      brandImages: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.loadAboutData();
  }

  private loadAboutData(): void {
    this.aboutService.getAbout().subscribe((data: any) => {
      if (data) {
        this.currentId = data._id;
        this.aboutForm.patchValue({
          content: data.content,
          bannerImage: data.bannerImage,
          intro: data.intro || {},
          cta: data.cta || {},
          open: data.open || {},
          schedule: data.schedule || {},
          teamSection: data.teamSection || {},
          testimonialsSection: data.testimonialsSection || {},
        });

        if (data.bannerImage) {
          this.imagePreviews['banner'] = data.bannerImage;
        }

        // Load nested images
        if (data.intro?.signatureImage) {
          this.imagePreviews['introSignature'] = data.intro.signatureImage;
        }
        if (data.intro?.image) {
          this.imagePreviews['introImage'] = data.intro.image;
        }
        if (data.cta?.backgroundImage) {
          this.imagePreviews['ctaBg'] = data.cta.backgroundImage;
        }
        if (data.open?.image) {
          this.imagePreviews['openImage'] = data.open.image;
        }

        // Load team members
        if (data.team && Array.isArray(data.team)) {
          this.clearFormArray(this.teamMembers);
          data.team.forEach((member: any) => this.addTeamMember(member));
        }

        // Load testimonials
        if (data.testimonials && Array.isArray(data.testimonials)) {
          this.clearFormArray(this.testimonials);
          data.testimonials.forEach((testimonial: any) =>
            this.addTestimonial(testimonial)
          );
        }

        // Load brand images
        if (data.brandImages && Array.isArray(data.brandImages)) {
          this.clearFormArray(this.brandImages);
          data.brandImages.forEach((image: string) => {
            this.brandImages.push(this.fb.control(image));
          });
        }
      }
    });
  }

  // Getter methods for form arrays
  get teamMembers() {
    return this.aboutForm.get('team') as FormArray;
  }

  get testimonials() {
    return this.aboutForm.get('testimonials') as FormArray;
  }

  get brandImages() {
    return this.aboutForm.get('brandImages') as FormArray;
  }

  private clearFormArray(formArray: FormArray) {
    while (formArray.length !== 0) {
      formArray.removeAt(0);
    }
  }

  // Team members methods
  addTeamMember(data: any = null) {
    const memberForm = this.fb.group({
      name: [data?.name || '', Validators.required],
      position: [data?.position || '', Validators.required],
      image: [data?.image || ''],
      facebook: [data?.facebook || ''],
      zalo: [data?.zalo || ''],
      linkedin: [data?.linkedin || ''],
    });

    this.teamMembers.push(memberForm);
  }

  removeTeamMember(index: number) {
    this.teamMembers.removeAt(index);
  }

  // Testimonials methods
  addTestimonial(data: any = null) {
    const testimonialForm = this.fb.group({
      name: [data?.name || '', Validators.required],
      position: [data?.position || ''],
      content: [data?.content || '', Validators.required],
      image: [data?.image || ''],
    });

    this.testimonials.push(testimonialForm);
  }

  removeTestimonial(index: number) {
    this.testimonials.removeAt(index);
  }

  // Image handling methods
  async onFileSelected(event: Event, type: string, index?: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        input.value = '';
        return;
      }

      // Validate banner dimensions
      if (type === 'banner') {
        const isValid = await this.checkImageDimensions(file, 1920, 720);
        if (!isValid) {
          alert('Banner image must be 1920x720 pixels');
          input.value = '';
          return;
        }
      }

      const key = type + (index !== undefined ? index : '');
      this.selectedImages[key] = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviews[key] = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async onMultipleFilesSelected(event: Event, type: string) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const validFiles: File[] = [];

      // Validate each file
      for (const file of Array.from(input.files)) {
        if (!file.type.startsWith('image/')) {
          alert('Please upload image files only');
          continue;
        }

        // Validate brand logo dimensions (max 300x300)
        if (type === 'brands') {
          const isValid = await this.checkImageMaxDimensions(file, 300, 300);
          if (!isValid) {
            alert(
              `Brand logo "${file.name}" is too large. Maximum size is 300x300 pixels`
            );
            continue;
          }
        }

        validFiles.push(file);
      }

      // Add valid files to preview
      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          this.brandImages.push(this.fb.control(reader.result as string));
        };
        reader.readAsDataURL(file);
      });

      // Clear input
      input.value = '';
    }
  }

  clearImage(key: string) {
    delete this.selectedImages[key];
    delete this.imagePreviews[key];
    if (key === 'banner') {
      this.aboutForm.get('bannerImage')?.setValue('');
    } else if (key === 'introSignature') {
      this.aboutForm.get('intro.signatureImage')?.setValue('');
    } else if (key === 'introImage') {
      this.aboutForm.get('intro.image')?.setValue('');
    } else if (key === 'ctaBg') {
      this.aboutForm.get('cta.backgroundImage')?.setValue('');
    } else if (key === 'openImage') {
      this.aboutForm.get('open.image')?.setValue('');
    } else if (key.startsWith('team')) {
      const index = parseInt(key.replace('team', ''), 10);
      this.teamMembers.at(index).get('image')?.setValue('');
    } else if (key.startsWith('testimonial')) {
      const index = parseInt(key.replace('testimonial', ''), 10);
      this.testimonials.at(index).get('image')?.setValue('');
    }
  }

  removeBrandImage(index: number) {
    this.brandImages.removeAt(index);
  }

  async onSubmit() {
    if (this.aboutForm.invalid) {
      return;
    }

    this.isUploading = true;
    try {
      const formData = new FormData();
      const formValue = this.aboutForm.value;

      // Add basic fields
      formData.append('content', formValue.content);

      // Handle banner image
      if (this.selectedImages['banner']) {
        formData.append('bannerImage', this.selectedImages['banner']);
      }

      // Handle intro section with images
      const introData = { ...formValue.intro };
      if (this.selectedImages['introSignature']) {
        const url = await this.uploadImage(
          this.selectedImages['introSignature'],
          'intro'
        );
        introData.signatureImage = url;
      }
      if (this.selectedImages['introImage']) {
        const url = await this.uploadImage(
          this.selectedImages['introImage'],
          'intro'
        );
        introData.image = url;
      }
      formData.append('intro', JSON.stringify(introData));

      // Handle CTA section with images
      const ctaData = { ...formValue.cta };
      if (this.selectedImages['ctaBg']) {
        const url = await this.uploadImage(this.selectedImages['ctaBg'], 'cta');
        ctaData.backgroundImage = url;
      }
      formData.append('cta', JSON.stringify(ctaData));

      // Handle open section with image
      const openData = { ...formValue.open };
      if (this.selectedImages['openImage']) {
        const url = await this.uploadImage(
          this.selectedImages['openImage'],
          'open'
        );
        openData.image = url;
      }
      formData.append('open', JSON.stringify(openData));

      // Handle schedule
      if (formValue.schedule) {
        formData.append('schedule', JSON.stringify(formValue.schedule));
      }

      // Handle section metadata
      if (formValue.teamSection) {
        formData.append('teamSection', JSON.stringify(formValue.teamSection));
      }
      if (formValue.testimonialsSection) {
        formData.append(
          'testimonialsSection',
          JSON.stringify(formValue.testimonialsSection)
        );
      }

      // Handle team members
      if (formValue.team) {
        const teamData = await Promise.all(
          formValue.team.map(async (member: any, index: number) => {
            if (this.selectedImages['team' + index]) {
              const imageUrl = await this.uploadImage(
                this.selectedImages['team' + index],
                'team'
              );
              return { ...member, image: imageUrl };
            }
            return member;
          })
        );
        formData.append('team', JSON.stringify(teamData));
      }

      // Handle testimonials
      if (formValue.testimonials) {
        const testimonialsData = await Promise.all(
          formValue.testimonials.map(
            async (testimonial: any, index: number) => {
              if (this.selectedImages['testimonial' + index]) {
                const imageUrl = await this.uploadImage(
                  this.selectedImages['testimonial' + index],
                  'testimonials'
                );
                return { ...testimonial, image: imageUrl };
              }
              return testimonial;
            }
          )
        );
        formData.append('testimonials', JSON.stringify(testimonialsData));
      }

      // Handle brand images
      if (formValue.brandImages && formValue.brandImages.length > 0) {
        const uploadedBrandImages = await Promise.all(
          formValue.brandImages.map(
            async (imageData: string, index: number) => {
              // If it's a data URL (newly uploaded), upload it to server
              if (imageData.startsWith('data:')) {
                // Convert data URL to File
                const blob = await fetch(imageData).then((r) => r.blob());
                const file = new File(
                  [blob],
                  `brand-${Date.now()}-${index}.png`,
                  { type: blob.type }
                );
                const uploadedUrl = await this.uploadImage(file, 'brands');
                return uploadedUrl;
              }
              // If it's already a server path, keep it
              return imageData;
            }
          )
        );
        formData.append('brandImages', JSON.stringify(uploadedBrandImages));
      }

      if (this.currentId) {
        await firstValueFrom(
          this.aboutService.updateAbout(this.currentId, formData)
        );
      } else {
        await firstValueFrom(this.aboutService.createAbout(formData));
      }

      // Reset file inputs
      this.selectedImages = {};
      this.resetAllFileInputs();
      this.loadAboutData(); // Reload the form with updated data

      // Show success message
      alert('Changes saved successfully! ✓');
    } catch (error: any) {
      console.error('Error saving about data:', error);
      const message =
        error?.error?.message ||
        error?.message ||
        'There was an error saving the data. Please try again.';
      alert('Error: ' + message);
    } finally {
      this.isUploading = false;
    }
  }

  private async uploadImage(file: File, folder: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      // replace toPromise() with firstValueFrom
      const response = await firstValueFrom(
        this.aboutService.uploadImage(formData)
      );
      return response.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Helper method to check image dimensions
  private checkImageDimensions(
    file: File,
    expectedWidth: number,
    expectedHeight: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        resolve(img.width === expectedWidth && img.height === expectedHeight);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  // Helper method to check max image dimensions
  private checkImageMaxDimensions(
    file: File,
    maxWidth: number,
    maxHeight: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        resolve(img.width <= maxWidth && img.height <= maxHeight);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  // Helper method to reset all file inputs
  private resetAllFileInputs(): void {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input: any) => {
      input.value = '';
    });
  }

  // Helper method to validate banner image
  private async validateBannerImage(file: File): Promise<boolean> {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return false;
    }

    const hasValidDimensions = await this.checkImageDimensions(file, 1920, 720);
    if (!hasValidDimensions) {
      alert('Banner image dimensions must be 1920x720 pixels');
      return false;
    }

    return true;
  }

  // Build absolute image URL for previews (supports http(s), data URLs, and backend relative paths)
  buildImageUrl(path?: string | null): string {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `http://localhost:3000${path}`;
  }
}
