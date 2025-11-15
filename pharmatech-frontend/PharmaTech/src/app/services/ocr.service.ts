import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OcrService {
  private api = 'http://localhost:3000/api/ocr';

  constructor(private http: HttpClient) {}

  read(body: { base64: string }): Observable<any> {
    return this.http.post(`${this.api}/read`, body);
  }
}
