import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ContactService, ContactData } from '../../../services/contact.service';
import { firstValueFrom } from 'rxjs';

@Component({
  templateUrl: './contact_user.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-contact-user',
})
export class ContactUserComponent implements OnInit {
  contact: ContactData | null = null;
  safeMapUrl: SafeResourceUrl;
  defaultMapUrl =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2136.986005919501!2d-73.9685579655238!3d40.75862446708152!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c258e4a1c884e5%3A0x24fe1071086b36d5!2sThe%20Atrium!5e0!3m2!1sen!2sbd!4v1585132512970!5m2!1sen!2sbd';

  contactMessageForm: FormGroup;
  isSubmitting = false;
  submitMessage = '';
  submitMessageType: 'success' | 'error' = 'success';

  constructor(
    private contactService: ContactService,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder
  ) {
    // Initialize with default map URL
    this.safeMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.defaultMapUrl
    );

    // Initialize contact form
    this.contactMessageForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadContactData();
  }

  async loadContactData() {
    try {
      this.contact = await firstValueFrom(this.contactService.getContact());
      console.log('Contact data loaded:', this.contact);
      // Update map URL if exists
      if (this.contact?.mapUrl) {
        console.log('Map URL found:', this.contact.mapUrl);
        this.safeMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          this.contact.mapUrl
        );
      } else {
        console.log('No map URL found, using default');
      }
    } catch (error) {
      console.error('Error loading contact data:', error);
    }
  }

  async onSubmitContactForm() {
    if (this.contactMessageForm.invalid) {
      this.showMessage('Please fill in all required fields correctly', 'error');
      return;
    }

    this.isSubmitting = true;
    this.submitMessage = '';

    try {
      await firstValueFrom(
        this.contactService.sendContactMessage(this.contactMessageForm.value)
      );

      this.showMessage(
        'Your message has been sent successfully! We will contact you soon.',
        'success'
      );
      this.contactMessageForm.reset();
    } catch (error) {
      console.error('Error sending message:', error);
      this.showMessage(
        'Failed to send message. Please try again later.',
        'error'
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  showMessage(text: string, type: 'success' | 'error') {
    this.submitMessage = text;
    this.submitMessageType = type;

    setTimeout(() => {
      this.submitMessage = '';
    }, 5000);
  }
}
