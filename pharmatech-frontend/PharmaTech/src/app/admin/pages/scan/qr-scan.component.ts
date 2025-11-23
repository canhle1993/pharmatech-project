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
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import * as XLSX from 'xlsx';

interface ScanRow {
  productId: string;
  name: string;
  model: string;
  count: number;
  scannedSerials: Set<string>;
}

interface ScannedQRDetail {
  qr: string;
  productId: string;
  serial: string;
  name: string;
  model: string;
}

@Component({
  selector: 'app-qr-scan',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    CardModule,
    ToastModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
  ],
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

  // 🌟 NEW: danh sách QR đã scan
  scannedQRList: ScannedQRDetail[] = [];

  soundEnabled = false;
  qrSearch: string = ''; // text để search QR Code

  constructor(
    private productService: ProductService,
    private router: Router,
    private messageService: MessageService
  ) {}

  // ======================================================
  // INIT
  // ======================================================
  async ngOnInit() {
    this.restoreSavedData(); // 🔥 Restore lịch sử quét

    this.setupAudioUnlock();
    await this.loadProducts();
    await this.startCamera();
  }
  // ======================================================
  // 🔍 SEARCH QR
  // ======================================================
  onQrSearch(event: any) {
    const keyword = event.target.value.trim().toLowerCase();
    this.qrSearch = keyword;

    const savedQRList = localStorage.getItem('qrScanList');

    if (!savedQRList) {
      this.scannedQRList = [];
      return;
    }

    const originalList: ScannedQRDetail[] = JSON.parse(savedQRList);

    if (!keyword) {
      this.scannedQRList = originalList;
      return;
    }

    this.scannedQRList = originalList.filter((item) =>
      item.qr.toLowerCase().includes(keyword)
    );
  }
  // ======================================================
  // 📤 EXPORT EXCEL (Scanned QR List)
  // ======================================================
  exportExcel() {
    if (!this.scannedQRList.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'There is no scanned QR to export.',
        life: 1500,
      });
      return;
    }

    const exportData = this.scannedQRList.map((x, index) => ({
      '#': index + 1,
      'QR Code': x.qr,
      Product: x.name,
      Model: x.model,
      Serial: x.serial,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Scanned QR List');

    XLSX.writeFile(workbook, 'scanned-qr-list.xlsx');

    this.messageService.add({
      severity: 'success',
      summary: 'Exported',
      detail: 'Excel file downloaded successfully.',
      life: 1200,
    });
  }

  // ======================================================
  // 🔄 RESTORE LOCALSTORAGE
  // ======================================================
  private restoreSavedData() {
    const saved = localStorage.getItem('qrScanHistory');
    if (saved) {
      const parsed = JSON.parse(saved);
      this.scanTable = parsed.map((row: any) => ({
        ...row,
        scannedSerials: new Set(row.scannedSerials),
      }));
      parsed.forEach((p: any) => {
        p.scannedSerials.forEach((s: string) => this.scannedQR.add(s));
      });
    }

    const savedQRList = localStorage.getItem('qrScanList');
    if (savedQRList) {
      this.scannedQRList = JSON.parse(savedQRList);
    }
  }

  goBack() {
    this.router.navigate(['/admin/product-stock-management']);
  }

  // ======================================================
  // 💾 SAVE DATA
  // ======================================================
  private saveData() {
    const plainData = this.scanTable.map((row) => ({
      ...row,
      scannedSerials: Array.from(row.scannedSerials),
    }));
    localStorage.setItem('qrScanHistory', JSON.stringify(plainData));
    localStorage.setItem('qrScanList', JSON.stringify(this.scannedQRList));
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
    this.scannedQRList = [];
    this.scannedQR.clear();
    this.lastScan = null;

    localStorage.removeItem('qrScanHistory');
    localStorage.removeItem('qrScanList');
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

    const constraints = {
      video: {
        deviceId: selected.deviceId,
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30, max: 60 },
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.preview.nativeElement.srcObject = stream;

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

    // không nhận trùng
    if (this.scannedQR.has(qr)) return;
    this.scannedQR.add(qr);

    const product = this.allProducts.find((p) => p.id === productId);
    if (!product) return;

    // gộp theo product
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

      // 🌟 Thêm vào danh sách QR đã scan
      this.scannedQRList.push({
        qr,
        productId,
        serial,
        name: product.name,
        model: product.model || '',
      });

      this.playBeep();
      this.saveData();

      // ✔ Toast thông báo
      this.messageService.add({
        severity: 'success',
        summary: 'Scan Successful',
        detail: `${product.name} (Serial: ${serial})`,
        life: 1200,
      });
    }
  }

  // ======================================================
  // 🔊 BEEP
  // ======================================================
  private playBeep() {
    if (!this.soundEnabled) return;
    const audio = new Audio('assets/sounds/beep.mp3');
    audio.play().catch(() => {});
  }
}
