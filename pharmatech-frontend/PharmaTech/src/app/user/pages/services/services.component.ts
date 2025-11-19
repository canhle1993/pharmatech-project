import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { env } from '../../../enviroments/enviroment';

interface TabData {
  id: string;
  label: string;
  icon: string;
  content: SafeHtml;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit {
  activeTab: string = 'consulting';
  bannerImage: string = '';
  imageBase = env.imageUrl;

  tabs: TabData[] = [
    { id: 'consulting', label: 'Consulting', icon: 'fa-lightbulb', content: '' },
    { id: 'technical-support', label: 'Technical Support', icon: 'fa-headset', content: '' },
    { id: 'equipment-upgrade', label: 'Equipment Upgrade', icon: 'fa-tools', content: '' },
    { id: 'maintenance', label: 'Maintenance', icon: 'fa-wrench', content: '' }
  ];

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load data from backend
    this.loadServiceData();

    // Get active tab from query params
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab && this.tabs.some(t => t.id === tab)) {
        this.activeTab = tab;
      }
    });
  }

  loadServiceData(): void {
    // Load content for each tab separately
    this.tabs.forEach(tab => {
      this.http.get(`${env.baseUrl}service/${tab.id}`).subscribe({
        next: (data: any) => {
          if (data) {
            // Update banner from first loaded tab
            if (!this.bannerImage && data.bannerImage) {
              this.bannerImage = this.buildImageUrl(data.bannerImage);
            }

            // Set content for this specific tab
            tab.content = this.sanitizer.bypassSecurityTrustHtml(data.content || '<p>No content available for this section.</p>');
          }
        },
        error: (error) => {
          console.error(`Error loading service data for ${tab.id}:`, error);
          tab.content = this.sanitizer.bypassSecurityTrustHtml('<p>Error loading content.</p>');
        }
      });
    });

    // Set default banner if none loaded
    if (!this.bannerImage) {
      this.bannerImage = 'assets/images/bg/Pharma-Natural.jpg';
    }
  }

  selectTab(tabId: string): void {
    this.activeTab = tabId;
    // Update URL without reloading page
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabId },
      queryParamsHandling: 'merge'
    });
  }

  isActive(tabId: string): boolean {
    return this.activeTab === tabId;
  }

  buildImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${this.imageBase}${imagePath}`;
  }
}
