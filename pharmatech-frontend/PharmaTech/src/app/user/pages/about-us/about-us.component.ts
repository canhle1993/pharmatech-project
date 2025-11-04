import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AboutService } from '../../../services/about.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class AboutUsComponent implements OnInit {
  about: any;

  constructor(
    private aboutService: AboutService,
    private sanitizer: DomSanitizer
  ){}

  ngOnInit(): void {
    this.aboutService.getAbout().subscribe((data: any) => {
      this.about = data;
    });
  }

  getYouTubeEmbedUrl(url: string | undefined): SafeResourceUrl | null {
    if (!url) return null;

    let videoId = '';

    // Extract video ID from various YouTube URL formats
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    }

    if (!videoId) return null;

    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
}
