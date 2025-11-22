import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../entities/product.entity';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface ScanRow {
  productId: string;
  name: string;
  model: string;
  count: number;
  scannedSerials: Set<string>;
}

@Component({
  selector: 'app-qr-scan',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, CardModule, ToastModule],
  providers: [MessageService],

  templateUrl: './qr-scan.component.html',
  styleUrls: ['./qr-scan.component.css'],
})
export class QrScanComponent implements OnInit {
  @ViewChild('preview', { static: false }) preview!: ElementRef;

  lastScan: string | null = null;
  allProducts: Product[] = [];

  scanTable: ScanRow[] = [];
  scannedQR = new Set<string>(); // tránh trùng QR

  soundEnabled = false;

  constructor(
    private productService: ProductService,
    private router: Router,
    private messageService: MessageService
  ) {}

  // ======================================================
  // INIT
  // ======================================================
  async ngOnInit() {
    this.restoreSavedData(); // <-- 🔥 Khôi phục dữ liệu khi tải trang

    this.setupAudioUnlock();
    await this.loadProducts();
    await this.startCamera();
  }

  // ======================================================
  // 🔄 KHÔI PHỤC DỮ LIỆU LƯU TRONG LOCALSTORAGE
  // ======================================================
  private restoreSavedData() {
    const saved = localStorage.getItem('qrScanHistory');
    if (!saved) return;

    const parsed = JSON.parse(saved);

    // Convert lại Set(serials)
    this.scanTable = parsed.map((row: any) => ({
      ...row,
      scannedSerials: new Set(row.scannedSerials),
    }));

    parsed.forEach((p: any) => {
      p.scannedSerials.forEach((s: string) => this.scannedQR.add(s));
    });
  }
  goBack() {
    this.router.navigate(['/admin/product-stock-management']);
  }
  // ======================================================
  // 📌 LƯU DATA
  // ======================================================
  private saveData() {
    const plainData = this.scanTable.map((row) => ({
      ...row,
      scannedSerials: Array.from(row.scannedSerials),
    }));

    localStorage.setItem('qrScanHistory', JSON.stringify(plainData));
  }
  getStock(productId: string): number {
    const p = this.allProducts.find((x) => x.id === productId);
    return p ? p.stock_quantity || 0 : 0;
  }

  // ======================================================
  // 🔘 RESET BUTTON
  // ======================================================
  resetScan() {
    this.scanTable = [];
    this.scannedQR.clear();
    this.lastScan = null;

    localStorage.removeItem('qrScanHistory'); // xoá luôn dữ liệu cũ
  }

  // ======================================================
  // AUDIO UNLOCK
  // ======================================================
  private setupAudioUnlock() {
    const unlock = () => {
      this.soundEnabled = true;
      const audio = new Audio('assets/sounds/beep.mp3');
      audio.play().catch(() => {});
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
  }

  // ======================================================
  // LOAD PRODUCT
  // ======================================================
  private async loadProducts() {
    const inStockRes: any = await this.productService.getProductsInStock();
    const outStockRes: any = await this.productService.getProductsOutOfStock();

    const inStock = Array.isArray(inStockRes)
      ? inStockRes
      : inStockRes?.data || [];
    const outStock = Array.isArray(outStockRes)
      ? outStockRes
      : outStockRes?.data || [];

    this.allProducts = [...inStock, ...outStock];
  }

  // ======================================================
  // CAMERA
  // ======================================================
  private async startCamera() {
    const codeReader = new BrowserMultiFormatReader();

    const devices = await BrowserMultiFormatReader.listVideoInputDevices();
    let selected = devices.find((d) => d.label.includes('DroidCam'));
    if (!selected) selected = devices[devices.length - 1];

    // ⚡ Tối ưu tốc độ quét
    const constraints = {
      video: {
        deviceId: selected.deviceId,
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30, max: 60 }, // tăng fps
      },
    };

    // ⚡ Lấy stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.preview.nativeElement.srcObject = stream;

    // ⚡ QUÉT LIÊN TỤC - API ĐÚNG
    await codeReader.decodeFromVideoDevice(
      selected.deviceId,
      this.preview.nativeElement,
      (result, err) => {
        if (result) {
          this.handleScan(result.getText());
        }
      }
    );
  }

  // ======================================================
  // 📌 HANDLE QR SCAN
  // ======================================================
  handleScan(qr: string) {
    this.lastScan = qr;

    const parts = qr.split('_');
    if (parts.length !== 3) return;

    const productId = parts[1];
    const serial = parts[2];

    if (this.scannedQR.has(qr)) return;
    this.scannedQR.add(qr);

    const product = this.allProducts.find((p) => p.id === productId);
    if (!product) return;

    let row = this.scanTable.find((r) => r.productId === productId);

    if (!row) {
      row = {
        productId,
        name: product.name,
        model: product.model || '',
        count: 0,
        scannedSerials: new Set<string>(),
      };
      this.scanTable.push(row);
    }

    if (!row.scannedSerials.has(serial)) {
      row.scannedSerials.add(serial);
      row.count = row.scannedSerials.size;

      this.playBeep();
      this.saveData(); // 🔥 SAVE mỗi lần scan thành công

      // 🌟 Thông báo toast
      this.messageService.add({
        severity: 'success',
        summary: 'Scan Successful',
        detail: `${product.name} (Serial: ${serial})`,
        life: 1500,
      });
    }
  }

  // ======================================================
  // 🔊 BEEP SOUND
  // ======================================================
  private playBeep() {
    if (!this.soundEnabled) return;
    const audio = new Audio('assets/sounds/beep.mp3');
    audio.play().catch(() => {});
  }
}
