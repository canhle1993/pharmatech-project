import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { env } from '../enviroments/enviroment';
import { Observable } from 'rxjs';

export interface AboutData {
  _id?: string;
  content: string;
  mission?: string;
  vision?: string;
  bannerImage?: string;
  facebook?: string;
  zalo?: string;
  statistics?: {
    clients?: number;
    products?: number;
    satisfaction?: number;
    experience?: number;
  };
  team?: Array<{
    name: string;
    position: string;
    image?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  }>;
  testimonials?: Array<{
    name: string;
    position?: string;
    content: string;
    image?: string;
  }>;
  brandImages?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AboutService {
  private readonly apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getAbout(): Observable<AboutData> {
    return this.http.get<AboutData>(`${this.apiUrl}/about`);
  }

  createAbout(data: FormData): Observable<AboutData> {
    return this.http.post<AboutData>(`${this.apiUrl}/about`, data);
  }

  updateAbout(id: string, data: FormData): Observable<AboutData> {
    return this.http.put<AboutData>(`${this.apiUrl}/about/${id}`, data);
  }

  uploadImage(formData: FormData): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.apiUrl}/api/account/upload`, formData);
  }
}
