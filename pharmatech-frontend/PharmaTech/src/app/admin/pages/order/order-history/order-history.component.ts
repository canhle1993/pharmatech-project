import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { OrderService } from '../../../../services/order.service';
import { Order } from '../../../../entities/order.entity';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { ConfirmationService, MessageService } from 'primeng/api';

import { InputTextModule } from 'primeng/inputtext'; // 🆕 CODE MỚI
import { IconFieldModule } from 'primeng/iconfield'; // 🆕 CODE MỚI
import { InputIconModule } from 'primeng/inputicon'; // 🆕 CODE MỚI
import { FormsModule } from '@angular/forms'; // 🆕 CODE MỚI
import { OcrService } from '../../../../services/ocr.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    TagModule,
    DialogModule,
    ProgressSpinnerModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    FormsModule,
  ],
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.css'],
})
export class OrderHistoryComponent implements OnInit {
  loading = true;
  completedOrders: Order[] = [];

  showImageDialog = false;
  selectedImage: string | null = null;

  selectedOcr: any = null;
  ocrLoading: boolean = false;

  ocrMap: Record<string, any> = {}; // Lưu OCR theo order ID
  ocrLoadingMap: Record<string, boolean> = {};

  constructor(
    private orderService: OrderService,
    private router: Router,
    private ocrService: OcrService
  ) {}

  async ngOnInit() {
    await this.loadCompletedOrders();
  }

  async loadCompletedOrders() {
    this.loading = true;
    try {
      const allOrders = await this.orderService.findAll();
      this.completedOrders = allOrders.filter((o) => o.status === 'Completed');

      // Sort newest → oldest
      this.completedOrders.sort(
        (a, b) =>
          new Date(b.updated_at || '').getTime() -
          new Date(a.updated_at || '').getTime()
      );
    } catch (err) {
      console.error('❌ loadCompletedOrders error:', err);
    } finally {
      this.loading = false;
    }
  }

  async runOCR(order: Order) {
    console.log('🟦 Scan OCR clicked. ORDER RECEIVED:', order);

    if (!order.payment_proof_url) {
      console.warn('❌ No payment_proof_url');
      return;
    }

    console.log('🟩 Image URL:', order.payment_proof_url);

    const imageUrl = order.payment_proof_url;

    this.ocrLoadingMap[order.id] = true;
    this.ocrMap[order.id] = null;

    try {
      const dataUrl = await this.convertUrlToBase64(imageUrl);
      console.log('🟩 Base64 URL:', dataUrl.substring(0, 40));

      const pureBase64 = dataUrl.split(',')[1];

      this.ocrService.read({ base64: pureBase64 }).subscribe({
        next: (res) => {
          console.log('🟩 OCR result:', res);

          this.ocrMap[order.id] = res.formatted;
          this.ocrLoadingMap[order.id] = false;
        },
        error: (err) => {
          console.error('OCR API error:', err);
          this.ocrLoadingMap[order.id] = false;
        },
      });
    } catch (err) {
      console.error('convertUrlToBase64 error:', err);
      this.ocrLoadingMap[order.id] = false;
    }
  }

  /** Convert URL → base64 */
  convertUrlToBase64(url: string): Promise<string> {
    console.log('⏳ Converting URL to base64:', url);

    return fetch(url)
      .then((res) => {
        console.log('🟦 fetch-res:', res);
        return res.blob();
      })
      .then((blob) => {
        console.log('🟨 Blob received:', blob);

        return new Promise<string>((resolve) => {
          const reader = new FileReader();

          reader.onloadend = () => {
            console.log('🟩 base64 generated!');
            resolve(reader.result as string);
          };

          reader.readAsDataURL(blob);
        });
      })
      .catch((err) => {
        console.error('❌ convertUrlToBase64 ERROR:', err);
        throw err;
      });
  }

  onView(order: Order) {
    this.router.navigate(['/admin/order/order-details', order.safeId]);
  }

  openImage(url: string) {
    this.selectedImage = url;
    this.showImageDialog = true;
  }
}
