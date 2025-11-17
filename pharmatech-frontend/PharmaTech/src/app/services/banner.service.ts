import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { env } from '../enviroments/enviroment';

export interface Banner {
  _id?: string;
  slide1: string;
  slide2: string;
  slide3: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BannerResponse {
  msg: string;
  data: Banner;
}

@Injectable({
  providedIn: 'root'
})
export class BannerService {
  private baseUrl = `${env.baseUrl}banner`;

  constructor(private http: HttpClient) {}

  getBanner(): Observable<BannerResponse> {
    return this.http.get<BannerResponse>(this.baseUrl);
  }

  updateBanner(formData: FormData): Observable<BannerResponse> {
    return this.http.post<BannerResponse>(this.baseUrl, formData);
  }
}
