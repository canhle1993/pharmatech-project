import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ContactData {
  _id?: string;
  content: string;
  bannerImage?: string;
  addresses?: string[];
  phones?: string[];
  emails?: string[];
  mapUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getContact(): Observable<ContactData> {
    return this.http.get<ContactData>(`${this.apiUrl}/contact`);
  }

  createContact(data: FormData): Observable<ContactData> {
    return this.http.post<ContactData>(`${this.apiUrl}/contact`, data);
  }

  updateContact(id: string, data: FormData): Observable<ContactData> {
    return this.http.put<ContactData>(`${this.apiUrl}/contact/${id}`, data);
  }

  uploadImage(file: File, folder: string = 'contact'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return this.http.post(`${this.apiUrl}/api/account/upload`, formData);
  }
}
