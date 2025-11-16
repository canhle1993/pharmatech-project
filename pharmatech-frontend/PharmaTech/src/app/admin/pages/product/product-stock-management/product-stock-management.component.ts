import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

import { Product } from '../../../../entities/product.entity';
import { ProductService } from '../../../../services/product.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-product-stock-management',
  standalone: true,
  templateUrl: './product-stock-management.component.html',
  styleUrls: ['./product-stock-management.component.css'],
  imports: [
    CommonModule,
    TabsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    FormsModule,
    ToastModule,
    ProgressSpinnerModule,
  ],
  providers: [MessageService],
})
export class ProductStockManagementComponent implements OnInit {
  tabs = [
    { title: '📦 In Stock', value: 0 },
    { title: '❌ Out of Stock', value: 1 },
  ];

  activeTab: number = 0;

  inStock: Product[] = [];
  outOfStock: Product[] = [];

  loading: boolean = true;

  // input số lượng nhập thêm theo từng dòng
  addedQtyMap: Record<string, number> = {};

  // Checkbox multi-select
  selectedIds: Set<string> = new Set();

  // Input thêm số lượng lớn cho nhiều sản phẩm
  bulkQty: number | null = null;

  searchText: string = '';
  private searchTimeout: any;

  // Pagination
  rows = 7; // per page
  first = 0;

  constructor(
    private productService: ProductService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  ngDoCheck() {
    console.log('ActiveTab:', this.activeTab);
  }

  async loadData() {
    this.loading = true;

    try {
      const list1: any = await this.productService.getProductsInStock();
      const list2: any = await this.productService.getProductsOutOfStock();

      this.inStock = list1;
      this.outOfStock = list2;
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load product stock.',
      });
    } finally {
      this.loading = false;
    }
  }

  exportExcel() {
    const data = this.activeTab === 0 ? this.inStock : this.outOfStock;

    if (!data || data.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'No products available to export.',
      });
      return;
    }

    const exportData = data.map((p) => ({
      ID: p.id,
      Name: p.name,
      Model: p.model || '',
      Stock: p.stock_quantity || 0,
      Status: p.stock_status || '',
      UpdatedAt: p.updated_at || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = {
      Sheets: { Inventory: worksheet },
      SheetNames: ['Inventory'],
    };
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const fileName =
      this.activeTab === 0
        ? 'inventory_in_stock.xlsx'
        : 'inventory_out_of_stock.xlsx';

    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, fileName);

    this.messageService.add({
      severity: 'success',
      summary: 'Exported',
      detail: 'Inventory exported successfully!',
    });
  }

  getStockClass(qty: number | undefined) {
    if (qty === undefined || qty === null) return '';

    if (qty <= 5) return 'stock-danger';
    if (qty <= 20) return 'stock-warning';
    return 'stock-safe';
  }

  // =====================================================
  //   SEARCH FUNCTION (ID + NAME)
  // =====================================================
  onSearchChange() {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      const keyword = this.searchText.toLowerCase();

      if (this.activeTab === 0) {
        this.inStock = this.inStock.filter(
          (p) =>
            p.id?.toLowerCase().includes(keyword) ||
            p.name?.toLowerCase().includes(keyword)
        );
      } else {
        this.outOfStock = this.outOfStock.filter(
          (p) =>
            p.id?.toLowerCase().includes(keyword) ||
            p.name?.toLowerCase().includes(keyword)
        );
      }

      if (this.searchText.trim() === '') {
        this.loadData();
      }
    }, 300);
  }

  // =====================================================
  //   SELECT MULTIPLE CHECKBOXES
  // =====================================================
  toggleSelect(id: string) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  // =====================================================
  //   UPDATE STOCK — SINGLE PRODUCT
  // =====================================================
  async updateStock(product: Product) {
    const qty = this.addedQtyMap[product.id!];

    if (!qty || qty <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid quantity',
        detail: 'Please enter a valid number.',
      });
      return;
    }

    try {
      product.loading = true;
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

      await this.productService.updateStock(
        product.id!,
        qty,
        user?.name || 'admin'
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Updated',
        detail: `${qty} items added to stock.`,
      });

      this.addedQtyMap[product.id!] = 0;
      await this.loadData();
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update stock.',
      });
    } finally {
      product.loading = false;
    }
  }

  // =====================================================
  //   BULK UPDATE FOR MULTIPLE PRODUCTS
  // =====================================================
  async updateBulkStock() {
    if (!this.bulkQty || this.bulkQty <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid quantity',
        detail: 'Enter a quantity for bulk update.',
      });
      return;
    }

    if (this.selectedIds.size === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No product selected',
        detail: 'Please select at least one product.',
      });
      return;
    }

    this.loading = true;

    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      for (let id of this.selectedIds) {
        await this.productService.updateStock(
          id,
          this.bulkQty,
          user?.name || 'admin'
        );
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Bulk Updated',
        detail: `Updated ${this.selectedIds.size} products.`,
      });

      this.bulkQty = null;
      this.selectedIds.clear();
      await this.loadData();
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update selected products.',
      });
    } finally {
      this.loading = false;
    }
  }
}
