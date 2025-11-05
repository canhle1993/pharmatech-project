import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface HotlineData {
  _id?: string;
  hotlineNumber: string;
  storeLocation: string;
}

@Injectable({
  providedIn: 'root',
})
export class HotlineService {
  private apiUrl = 'http://localhost:3000/api/hotline';

  constructor(private http: HttpClient) {}

  getHotlineInfo(): Observable<HotlineData> {
    return this.http.get<HotlineData>(this.apiUrl);
  }

  createHotlineInfo(data: HotlineData): Observable<HotlineData> {
    return this.http.post<HotlineData>(this.apiUrl, data);
  }

  updateHotlineInfo(id: string, data: HotlineData): Observable<HotlineData> {
    return this.http.put<HotlineData>(`${this.apiUrl}/${id}`, data);
  }
}
