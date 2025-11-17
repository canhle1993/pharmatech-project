import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { env } from '../enviroments/enviroment';

export interface Quote {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: Date;
  updatedAt: Date;
  repliedAt?: Date;
  replyMessage?: string;
}

export interface QuoteResponse {
  msg: string;
  data: Quote[];
  total: number;
}

export interface QuoteDetailResponse {
  msg: string;
  data: Quote;
}

export interface UnreadCountResponse {
  msg: string;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  private baseUrl = `${env.baseUrl}quote`;

  constructor(private http: HttpClient) { }

  getQuotes(status?: string, page: number = 1, limit: number = 10): Observable<QuoteResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<QuoteResponse>(this.baseUrl, { params });
  }

  getQuoteById(id: string): Observable<QuoteDetailResponse> {
    return this.http.get<QuoteDetailResponse>(`${this.baseUrl}/${id}`);
  }

  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.baseUrl}/unread-count`);
  }

  markAsRead(id: string): Observable<QuoteDetailResponse> {
    return this.http.put<QuoteDetailResponse>(`${this.baseUrl}/${id}/read`, {});
  }

  sendReply(id: string, replyMessage: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/reply`, { replyMessage });
  }

  deleteQuote(id: string): Observable<QuoteDetailResponse> {
    return this.http.delete<QuoteDetailResponse>(`${this.baseUrl}/${id}`);
  }
}
