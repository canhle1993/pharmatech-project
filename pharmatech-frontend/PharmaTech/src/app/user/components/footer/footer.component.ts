import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ContactService } from '../../../services/contact.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  standalone: true,
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
})
export class FooterComponent implements OnInit {
  newsletterForm: FormGroup;
  isSubmitting = false;
  submitMessage = '';
  submitMessageType: 'success' | 'error' = 'success';

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    private messageService: MessageService
  ) {
    this.newsletterForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: [''],
    });
  }

  ngOnInit() {}

  onSubmitNewsletter(): void {
    if (this.newsletterForm.invalid) {
      Object.keys(this.newsletterForm.controls).forEach((key) => {
        this.newsletterForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.submitMessage = '';

    const formData = {
      firstName: this.newsletterForm.value.firstName,
      lastName: this.newsletterForm.value.lastName,
      email: this.newsletterForm.value.email,
      message:
        this.newsletterForm.value.message || 'Newsletter subscription request',
    };

    this.contactService.sendContactMessage(formData).subscribe({
      next: () => {
        this.submitMessageType = 'success';
        this.submitMessage =
          'Thank you! Your message has been sent successfully.';
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Thank you! Your message has been sent successfully.',
          life: 5000,
        });
        this.newsletterForm.reset();
        this.isSubmitting = false;

        setTimeout(() => {
          this.submitMessage = '';
        }, 5000);
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.submitMessageType = 'error';
        this.submitMessage = 'Failed to send message. Please try again.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to send message. Please try again.',
          life: 5000,
        });
        this.isSubmitting = false;

        setTimeout(() => {
          this.submitMessage = '';
        }, 5000);
      },
    });
  }
}
