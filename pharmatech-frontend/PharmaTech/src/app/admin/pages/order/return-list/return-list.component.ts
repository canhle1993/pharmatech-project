import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';

import { ReturnService } from '../../../../services/return.service';
import { OrderService } from '../../../../services/order.service';
import { ProductService } from '../../../../services/product.service';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { Order } from '../../../../entities/order.entity';
import { Router } from '@angular/router';
import { env } from '../../../../enviroments/enviroment';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-return-list',
  templateUrl: './return-list.component.html',
  styleUrls: ['./return-list.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    TabsModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    TagModule,
    FormsModule,
    DialogModule,
    FileUploadModule,
    MultiSelectModule,
    InputNumberModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
  ],
  providers: [MessageService, ConfirmationService],
})
export class ReturnListComponent implements OnInit {
  loading = true;
  currentUserName: string = 'admin';

  tabs = [
    { title: '🔄 Pending Returns', value: 'Pending Manufacturer' },
    { title: '✅ Completed Returns', value: 'Completed' },
  ];
  activeTab = 'Pending Manufacturer';

  pendingList: any[] = [];
  completedList: any[] = [];

  // 🆕 search chung
  searchText: string = '';
  private searchTimeout: any;

  // ADD dialog
  showAddDialog = false;

  addData = {
    order_id: '',
    order_detail_ids: [] as string[],
    replacement_product_id: '',
    reason: '',
    damage_photos: [] as string[],
  };

  // resources
  allOrders: any[] = [];
  completedOrders: any[] = [];

  orderDetails: any[] = [];
  allProducts: any[] = [];

  filteredProducts: any[] = [];
  returnItems: any[] = [];
  replacementProducts: any[] = [];

  constructor(
    private returnService: ReturnService,
    private orderService: OrderService,
    private productService: ProductService,
    private message: MessageService,
    private confirm: ConfirmationService,
    private router: Router
  ) {}

  async ngOnInit() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.currentUserName = currentUser?.name || 'admin';
    await this.loadReturns();
    await this.loadOrders();
    await this.loadProducts();
  }

  // =======================
  // LOAD DATA
  // =======================
  async loadReturns() {
    this.loading = true;
    try {
      const all = await this.returnService.findAll();
      this.pendingList = all.filter((x) => x.status === 'Pending Manufacturer');

      this.completedList = all.filter((x) => x.status === 'Completed');
    } catch (err) {
      console.error(err);
      this.message.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load return requests',
      });
    } finally {
      this.loading = false;
    }
  }
  // 🔍 user gõ search
  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      // filter dùng getFilteredReturns, nên ở đây không cần làm gì thêm
    }, 300);
  }

  // 🔍 trả ra list đã filter theo tab + search
  getFilteredReturns(tabValue: string): any[] {
    const base =
      tabValue === 'Pending Manufacturer'
        ? this.pendingList
        : this.completedList;

    if (!this.searchText.trim()) return base;

    const keyword = this.searchText.toLowerCase();

    return base.filter(
      (r) =>
        (r.order_id && r.order_id.toLowerCase().includes(keyword)) ||
        (r.replacement_product_name &&
          r.replacement_product_name.toLowerCase().includes(keyword))
    );
  }

  async loadOrders() {
    this.allOrders = await this.orderService.findAll();

    // ⚠️ allOrders lúc này là tất cả orders (Pending, Approved, Rejected,…)

    // ✅ Lọc chỉ những order hoàn tất giao hàng
    this.completedOrders = this.allOrders.filter(
      (o: any) => o.status === 'Completed'
    );
  }

  async loadProducts() {
    try {
      const res: any = await this.productService.findAll();

      // nếu BE trả về dạng { data: [...] }
      this.allProducts = res.data || res || [];

      if (!Array.isArray(this.allProducts)) {
        this.allProducts = [];
      }
    } catch (err) {
      console.error(err);
      this.allProducts = [];
    }
  }

  // =======================
  // DIALOG: SELECT ORDER
  // =======================
  async onSelectOrder() {
    if (!this.addData.order_id) return;

    const items = await this.orderService.findDetailsByOrder(
      this.addData.order_id
    );

    // generate returnItems
    this.returnItems = items.map((item: any) => ({
      ...item,
      selected: false,
      return_qty: 1,
    }));

    // replacementProduct chỉ là các sản phẩm có trong order
    this.replacementProducts = this.returnItems.map((x) => ({
      id: x.product_id,
      name: x.product_name,
      model: x.product_model,
    }));
  }

  onToggleItem(selectedItem: any) {
    // Bỏ chọn tất cả
    this.returnItems.forEach((i) => {
      if (i !== selectedItem) i.selected = false;
    });

    // Giữ lại item hiện tại
    selectedItem.selected = true;

    // Cập nhật lại danh sách replacementProducts
    this.updateReplacementProducts();
  }

  updateReplacementProducts() {
    const selectedItems = this.returnItems.filter((i) => i.selected);

    // 👉 Lọc theo product trong order + có stock > 0
    this.replacementProducts = selectedItems
      .map((i) => {
        const productInStore = this.allProducts.find(
          (p) => p.id === i.product_id
        );

        // Nếu product không tồn tại hoặc không còn hàng → bỏ qua
        if (!productInStore || productInStore.stock_quantity <= 0) {
          return null;
        }

        return {
          id: i.product_id,
          name: i.product_name,
          model: i.product_model,
          stock: productInStore.stock_quantity,
        };
      })
      .filter((x) => x !== null); // xoá các item null

    // 👉 Reset nếu product đã chọn không còn hợp lệ nữa
    if (
      !this.replacementProducts.some(
        (p) => p.id === this.addData.replacement_product_id
      )
    ) {
      this.addData.replacement_product_id = '';
    }
  }

  async onView(row: any) {
    const orderId = row.order_id;

    if (!orderId) {
      console.warn('⚠️ No order_id found', row);
      return;
    }

    this.router.navigate(['/admin/order/order-details', orderId]);
  }

  // =======================
  // UPLOAD DAMAGE PHOTO
  // =======================
  async uploadDamageFile(event: any) {
    const file = event.files[0];
    if (!file) return;

    try {
      const res = await this.returnService.uploadDamage(file);
      this.addData.damage_photos.push(res.filename);
    } catch (err) {
      console.error(err);
      this.message.add({
        severity: 'error',
        summary: 'Upload Error',
        detail: 'Failed to upload image',
      });
    }
  }

  // =======================
  // CREATE RETURN REQUEST
  // =======================
  async submitAdd() {
    const selectedItems = this.returnItems
      .filter((i) => i.selected)
      .map((i) => ({
        order_detail_id: i.id,
        quantity: i.return_qty,
      }));

    if (
      !this.addData.order_id ||
      !selectedItems.length ||
      !this.addData.replacement_product_id
    ) {
      this.message.add({
        severity: 'warn',
        summary: 'Missing Data',
        detail: 'Please fill all required fields.',
      });
      return;
    }

    const order_detail_ids = selectedItems.map((i) => i.order_detail_id);

    const payload = {
      order_id: Array.isArray(this.addData.order_id)
        ? this.addData.order_id[0]
        : this.addData.order_id,

      order_detail_ids,

      replacement_product_id: Array.isArray(this.addData.replacement_product_id)
        ? this.addData.replacement_product_id[0]
        : this.addData.replacement_product_id,

      reason: this.addData.reason,
      damage_photos: this.addData.damage_photos,
      updated_by: this.currentUserName,
      items: selectedItems,
    };

    try {
      await this.returnService.create(payload);

      this.message.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Return request created!',
      });

      this.showAddDialog = false;
      await this.loadReturns();
    } catch (err: any) {
      this.message.add({
        severity: 'error',
        summary: 'Error',
        detail: err.error?.error || 'Failed to create return request',
      });
    }
  }

  // =======================
  // MARK COMPLETED
  // =======================
  async markComplete(row: any) {
    this.confirm.confirm({
      message: 'Mark this as Completed?',
      accept: async () => {
        try {
          await this.returnService.markCompleted(row.id, this.currentUserName);
          this.message.add({
            severity: 'success',
            summary: 'Completed',
            detail: 'Marked as completed.',
          });
          await this.loadReturns();
        } catch (err) {
          this.message.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update status',
          });
        }
      },
    });
  }

  getBadge(status: string) {
    switch (status) {
      case 'Pending Manufacturer':
        return 'warn';
      case 'Completed':
        return 'success';
      default:
        return 'info';
    }
  }
}
