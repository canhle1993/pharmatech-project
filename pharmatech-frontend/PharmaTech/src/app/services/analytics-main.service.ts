import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsMainService {
  private api = 'http://localhost:3000/api/analytics';

  constructor(private http: HttpClient) {}

  getOverviewCards(): Observable<any> {
    return this.http.get(`${this.api}/overview`);
  }

  getRevenueMonthly(): Observable<any> {
    return this.http.get(`${this.api}/orders/monthly`);
  }

  getOrdersByStatus(): Observable<any> {
    return this.http.get(`${this.api}/orders/status`);
  }

  getProductsByCategory(): Observable<any> {
    return this.http.get(`${this.api}/products/by-category`);
  }

  getCareerByDepartment(): Observable<any> {
    return this.http.get(`${this.api}/careers/monthly`);
  }
}
