import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ContactService, ContactData } from '../../../services/contact.service';
import { firstValueFrom } from 'rxjs';

@Component({
  templateUrl: './contact_user.component.html',
  standalone: true,
  imports: [CommonModule],
  selector: 'app-contact-user',
})
export class ContactUserComponent implements OnInit {
  contact: ContactData | null = null;
  safeMapUrl: SafeResourceUrl;
  defaultMapUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2136.986005919501!2d-73.9685579655238!3d40.75862446708152!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c258e4a1c884e5%3A0x24fe1071086b36d5!2sThe%20Atrium!5e0!3m2!1sen!2sbd!4v1585132512970!5m2!1sen!2sbd';

  constructor(
    private contactService: ContactService,
    private sanitizer: DomSanitizer
  ) {
    // Initialize with default map URL
    this.safeMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.defaultMapUrl);
  }

  ngOnInit(): void {
    this.loadContactData();
  }

  async loadContactData() {
    try {
      this.contact = await firstValueFrom(this.contactService.getContact());
      // Update map URL if exists
      if (this.contact?.mapUrl) {
        this.safeMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.contact.mapUrl);
      }
    } catch (error) {
      console.error('Error loading contact data:', error);
    }
  }
}
