import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from 'src/product/product.decorator';
import { Category } from 'src/category/category.decorator';
import { Order } from 'src/order/order.decorator';
import { Career } from 'src/career/career.decorator';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
    @InjectModel(Career.name)
    private readonly careerModel: Model<Career>,
  ) {}

  // ========= 0. OVERVIEW – các thẻ nhỏ trên đầu dashboard =============
  async getOverviewCards() {
    const [
      totalProducts,
      activeProducts,
      totalCategories,
      activeCategories,
      totalOrders,
      totalRevenueAgg,
      activeJobs,
    ] = await Promise.all([
      this.productModel.countDocuments({ is_delete: false }),
      this.productModel.countDocuments({ is_delete: false, is_active: true }),
      this.categoryModel.countDocuments({ is_delete: false }),
      this.categoryModel.countDocuments({ is_delete: false, is_active: true }),
      this.orderModel.countDocuments({ is_delete: false }),
      this.orderModel.aggregate([
        { $match: { is_delete: false } },
        { $group: { _id: null, total: { $sum: '$total_amount' } } },
      ]),
      this.careerModel.countDocuments({ is_delete: false, is_active: true }),
    ]);

    const totalRevenue =
      totalRevenueAgg && totalRevenueAgg.length > 0
        ? totalRevenueAgg[0].total
        : 0;

    return {
      products: { total: totalProducts, active: activeProducts },
      categories: { total: totalCategories, active: activeCategories },
      orders: { total: totalOrders, totalRevenue },
      careers: { active: activeJobs },
    };
  }

  // ========= 1. CHART: Orders & Revenue theo tháng =====================
  async getOrdersMonthly(year?: number) {
    const now = new Date();
    const y = year || now.getFullYear();

    const start = new Date(y, 0, 1);
    const end = new Date(y + 1, 0, 1);

    const agg = await this.orderModel.aggregate([
      {
        $match: {
          is_delete: false,
          created_at: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$created_at' } },
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$total_amount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    return months.map((m) => {
      const found = agg.find((r) => r._id.month === m);
      return {
        month: m,
        orderCount: found?.orderCount ?? 0,
        totalRevenue: found?.totalRevenue ?? 0,
      };
    });
  }

  // ========= 2. CHART: Orders theo status ==============================
  async getOrdersByStatus() {
    const agg = await this.orderModel.aggregate([
      { $match: { is_delete: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$total_amount' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return agg.map((r) => ({
      status: r._id || 'Unknown',
      count: r.count,
      totalRevenue: r.totalRevenue,
    }));
  }

  // ========= 3. CHART: Product theo Category (pie / bar) ===============
  async getProductsByCategory() {
    // 1) Lấy tất cả product chưa xoá
    const products = await this.productModel
      .find({ is_delete: false })
      .select('category_ids')
      .lean();

    const counter = new Map<string, number>();

    for (const p of products) {
      const cats: Types.ObjectId[] = (p as any).category_ids || [];
      for (const cid of cats) {
        const key = String(cid);
        counter.set(key, (counter.get(key) || 0) + 1);
      }
    }

    if (counter.size === 0) return [];

    // 2) Lấy tên category tương ứng
    const categoryIds = Array.from(counter.keys()).map(
      (id) => new Types.ObjectId(id),
    );

    const categories = await this.categoryModel
      .find({ _id: { $in: categoryIds } })
      .select('name')
      .lean();

    return categoryIds.map((cid) => {
      const info = categories.find(
        (c) => String((c as any)._id) === String(cid),
      );
      return {
        category_id: String(cid),
        category_name: (info as any)?.name || 'Unknown',
        productCount: counter.get(String(cid)) || 0,
      };
    });
  }

  // ========= 4. CHART: Career posts theo tháng =========================
  async getCareersMonthly(year?: number) {
    const now = new Date();
    const y = year || now.getFullYear();

    const start = new Date(y, 0, 1);
    const end = new Date(y + 1, 0, 1);

    const agg = await this.careerModel.aggregate([
      { $match: { is_delete: false } },

      // EP DATE string → real DATE
      { $addFields: { posted_date_casted: { $toDate: '$posted_date' } } },

      {
        $match: {
          posted_date_casted: {
            $gte: start,
            $lt: end,
          },
        },
      },

      {
        $group: {
          _id: { month: { $month: '$posted_date_casted' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    // console.log('CAREER MONTHLY RAW:', agg);

    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return months.map((m) => {
      const found = agg.find((r) => r._id.month === m);
      return { month: m, count: found?.count ?? 0 };
    });
  }
}
