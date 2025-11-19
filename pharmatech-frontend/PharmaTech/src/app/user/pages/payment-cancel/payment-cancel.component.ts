import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-payment-cancel',
  imports: [CommonModule],
  template: `
    <div class="cancel-wrapper">
      <div class="cancel-card">
        <div class="icon">✖</div>
        <h2>Payment Cancelled</h2>
        <p>Your payment was not completed.</p>

        <button class="back-btn" (click)="goBack()">Return to Checkout</button>
      </div>
    </div>
  `,
  styles: [
    `
      .cancel-wrapper {
        height: 80vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #fdf1f1;
      }

      .cancel-card {
        text-align: center;
        background: #fff;
        padding: 40px 60px;
        border-radius: 16px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        animation: fadeUp 0.4s ease-out;
      }

      .icon {
        font-size: 55px;
        color: #d9534f;
        margin-bottom: 10px;
      }

      h2 {
        margin-bottom: 10px;
        font-weight: 600;
      }

      p {
        color: #777;
        margin-bottom: 25px;
      }

      .back-btn {
        background: #d9534f;
        color: white;
        border: none;
        padding: 12px 22px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 15px;
      }

      .back-btn:hover {
        background: #c9302c;
      }

      @keyframes fadeUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class PaymentCancelComponent implements OnInit {
  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    const userId = this.route.snapshot.queryParamMap.get('uid');
  }

  goBack() {
    this.router.navigate(['/checkout']);
  }
}
