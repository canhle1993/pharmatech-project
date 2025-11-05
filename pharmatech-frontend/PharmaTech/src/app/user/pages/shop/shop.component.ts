import { Component, OnInit, Renderer2 } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../../services/category.service';
import { ProductService } from '../../../services/product.service';
import { env } from '../../../enviroments/enviroment';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  templateUrl: './shop.component.html',
  imports: [CommonModule, RouterLink, FormsModule],
  providers: [CategoryService, ProductService],
})
export class ShopComponent implements OnInit {
  Math = Math;
  categories: any[] = [];
  products: any[] = [];
  filteredProducts: any[] = [];
  selectedCategoryId: string | null = null;
  searchTerm: string = ''; // ✅ thêm biến này
  imageBase = env.imageUrl;

  // === 🧭 Phân trang ===
  currentPage: number = 1;
  itemsPerPage: number = 12; // mặc định
  totalPages: number = 1;
  pagedProducts: any[] = [];

  constructor(
    private renderer: Renderer2,
    private categoryService: CategoryService,
    private productService: ProductService,
    private route: ActivatedRoute // ✅ thêm vào
  ) {}

  async ngOnInit() {
    await this.loadCategories();
    await this.loadProducts();

    // ✅ Nhận param từ header
    this.route.queryParams.subscribe((params) => {
      const categoryId = params['category'];
      if (categoryId) {
        this.onSelectCategory(categoryId);
      }
    });
  }

  /** 🔄 Sort products by newest or oldest */
  onSortChange(event: any) {
    const value = event.target.value;
    let sorted = [...this.filteredProducts];

    if (value === 'latest') {
      // 🆕 Newest first (based on created_at or ObjectId timestamp)
      sorted.sort((a: any, b: any) => {
        const aDate = new Date(a.created_at || a._id);
        const bDate = new Date(b.created_at || b._id);
        return bDate.getTime() - aDate.getTime();
      });
    } else if (value === 'oldest') {
      // 🕰️ Oldest first
      sorted.sort((a: any, b: any) => {
        const aDate = new Date(a.created_at || a._id);
        const bDate = new Date(b.created_at || b._id);
        return aDate.getTime() - bDate.getTime();
      });
    }

    this.filteredProducts = sorted;
    this.currentPage = 1;
    this.updatePagination();
  }

  onSearch() {
    const keyword = this.searchTerm.trim().toLowerCase();
    this.currentPage = 1;

    // Lọc theo category trước
    let baseList = [...this.products];
    if (this.selectedCategoryId) {
      const pick = this.selectedCategoryId.toString();
      baseList = baseList.filter((p: any) => {
        if (
          Array.isArray(p.category_ids) &&
          p.category_ids.some((cid: any) => cid?.toString() === pick)
        )
          return true;
        if (
          Array.isArray(p.categories) &&
          p.categories.some((c: any) => (c?.id ?? c?._id)?.toString() === pick)
        )
          return true;
        return false;
      });
    }

    // ✅ Lọc tiếp theo tên
    if (keyword) {
      this.filteredProducts = baseList.filter((p: any) =>
        p.name?.toLowerCase().includes(keyword)
      );
    } else {
      this.filteredProducts = [...baseList];
    }

    this.updatePagination();
  }

  /** 🧾 Load Category */
  async loadCategories() {
    try {
      const res: any = await this.categoryService.findAll();
      this.categories = Array.isArray(res) ? res : [];
    } catch (err) {
      console.error('❌ Load categories failed:', err);
    }
  }

  /** 📦 Load Product */
  async loadProducts() {
    try {
      const res: any = await this.productService.findAll();
      this.products = Array.isArray(res) ? res : [];

      // Ghép full URL ảnh (nếu cần)
      this.products = this.products.map((p: any) => ({
        ...p,
        photo: p?.photo?.startsWith('http')
          ? p.photo
          : p?.photo
          ? this.imageBase + p.photo
          : null,
      }));

      this.filteredProducts = [...this.products];
      this.updatePagination(); // ✅ cập nhật trang đầu tiên
    } catch (err) {
      console.error('❌ Load products failed:', err);
    }
  }

  /** 🔄 Cập nhật danh sách trang hiện tại */
  updatePagination() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.totalPages = Math.ceil(
      this.filteredProducts.length / this.itemsPerPage
    );
    this.pagedProducts = this.filteredProducts.slice(start, end);
  }

  /** ⬅️ ➡️ Chuyển trang */
  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  /** 🔢 Khi đổi số sản phẩm mỗi trang */
  onChangePageSize(event: any) {
    this.itemsPerPage = Number(event.target.value) || 6;
    this.currentPage = 1;
    this.updatePagination();
  }

  /** 📦 Khi chọn Category thì reset về trang 1 */
  onSelectCategory(id: string | null) {
    this.selectedCategoryId = id;
    this.currentPage = 1;

    if (!id) {
      this.filteredProducts = [...this.products];
    } else {
      const pick = id.toString();
      this.filteredProducts = this.products.filter((p: any) => {
        if (
          Array.isArray(p.category_ids) &&
          p.category_ids.some((cid: any) => cid?.toString() === pick)
        )
          return true;

        if (
          Array.isArray(p.categories) &&
          p.categories.some((c: any) => (c?.id ?? c?._id)?.toString() === pick)
        )
          return true;

        return false;
      });
    }

    this.updatePagination(); // ✅ cập nhật lại danh sách hiển thị
  }
}
