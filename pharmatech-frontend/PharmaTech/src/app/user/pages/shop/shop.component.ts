import { Component, OnInit, Renderer2 } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../../services/category.service';
import { ProductService } from '../../../services/product.service';
import { env } from '../../../enviroments/enviroment';
import { FormsModule } from '@angular/forms';
import { WishlistService } from '../../../services/wishlist.service';
import { CartStateService } from '../../../services/cart-state.service';
import { CartService } from '../../../services/cart.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  standalone: true,
  templateUrl: './shop.component.html',
  imports: [CommonModule, RouterLink, FormsModule, ToastModule],
  providers: [CategoryService, ProductService, MessageService],
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
    private route: ActivatedRoute,
    private cartService: CartService,
    private cartState: CartStateService,
    private wishlistService: WishlistService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    const userId = localStorage.getItem('userId');
    if (userId) {
      // ✅ Load lại giỏ hàng từ DB để đồng bộ state (fix lỗi F5 mất state)
      await this.cartState.loadUserCart(userId);
    }
    await this.loadAssets();
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
  async addToWishlist(product: any) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Please login',
        detail: 'You must log in to add items to wishlist.',
      });
      return;
    }

    try {
      // ✅ Gọi API thêm sản phẩm vào wishlist
      await this.wishlistService.addToWishlist({
        user_id: userId,
        product_id: product._id || product.id,
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Added to Wishlist',
        detail: `${product.name} has been added to your wishlist.`,
      });
    } catch (error: any) {
      console.error('❌ addToWishlist error:', error);

      // ✅ Nếu sản phẩm đã tồn tại (409 Conflict)
      const backendMsg =
        error?.error?.message || error?.message || 'Unable to add to wishlist.';

      const isConflict =
        error?.status === 409 || backendMsg.includes('already in wishlist');

      this.messageService.add({
        severity: isConflict ? 'info' : 'error',
        summary: isConflict ? 'Already in Wishlist' : 'Failed',
        detail: isConflict
          ? `${product.name} is already in your wishlist.`
          : backendMsg,
      });
    }
  }

  async addToCart(product: any) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Please login',
        detail: 'You must log in to add items to cart.',
      });
      return;
    }

    // ✅ Kiểm tra tồn kho trước khi thêm
    if (!product.stock_quantity || product.stock_quantity <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Out of stock',
        detail: `${product.name} is currently out of stock.`,
      });
      return;
    }

    // ✅ Kiểm tra nếu đã có trong giỏ hàng và sắp vượt tồn kho
    const existingItem = this.cartState['_items']
      .getValue()
      .find(
        (i) => i.product_id?._id === product._id || i.product_id === product._id
      );

    if (existingItem && existingItem.quantity + 1 > product.stock_quantity) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Stock limit reached',
        detail: `Only ${product.stock_quantity} items are available in stock.`,
      });
      return;
    }

    try {
      // ✅ Thêm sản phẩm vào giỏ (qua CartStateService)
      await this.cartState.addToCart({
        user_id: userId,
        product_id: product._id || product.id,
        price: product.price || 0,
        quantity: 1,
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Added to Cart',
        detail: `${product.name} has been added to your cart.`,
      });
    } catch (error: any) {
      console.error('❌ addToCart error:', error);

      // ✅ Lấy thông báo cụ thể từ backend nếu có
      const backendMsg =
        error?.error?.message ||
        error?.message ||
        'Unable to add product to cart. Please try again.';

      this.messageService.add({
        severity: 'error',
        summary: 'Failed',
        detail: backendMsg,
      });
    }
  }

  private async loadAssets() {
    const addCss = (href: string) =>
      new Promise<void>((resolve) => {
        const link = this.renderer.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => resolve();
        this.renderer.appendChild(document.head, link);
      });

    const addJs = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const s = this.renderer.createElement('script');
        s.src = src;
        s.type = 'text/javascript';
        s.onload = () => resolve();
        s.onerror = (e: any) => reject(e);
        this.renderer.appendChild(document.body, s);
      });

    const cssFiles = [
      'assets/css/vendor/bootstrap.min.css',
      'assets/css/vendor/lastudioicons.css',
      'assets/css/vendor/dliconoutline.css',
      'assets/css/animate.min.css',
      'assets/css/swiper-bundle.min.css',
      'assets/css/ion.rangeSlider.min.css',
      'assets/css/lightgallery-bundle.min.css',
      'assets/css/magnific-popup.css',
      'assets/css/style.css',
    ];
    for (const href of cssFiles) await addCss(href);

    // ✅ BẮT BUỘC: jQuery trước, rồi mới các script khác
    await addJs('assets/js/vendor/jquery-3.6.0.min.js');
    await addJs('assets/js/vendor/jquery-migrate-3.3.2.min.js');
    await addJs('assets/js/vendor/bootstrap.bundle.min.js');
    await addJs('assets/js/countdown.min.js');
    await addJs('assets/js/ajax.js');
    await addJs('assets/js/jquery.validate.min.js');
    await addJs('assets/js/swiper-bundle.min.js');
    await addJs('assets/js/ion.rangeSlider.min.js');
    await addJs('assets/js/lightgallery.min.js');
    await addJs('assets/js/jquery.magnific-popup.min.js');
    await addJs('assets/js/main.js');
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
