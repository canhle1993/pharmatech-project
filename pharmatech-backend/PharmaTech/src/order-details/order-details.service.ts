import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { OrderDetails } from './order-details.decorator';
import { OrderDetailsDTO } from './order-details.dto';

// ⬇️ Nếu ProductService nằm chỗ khác, chỉnh lại đường dẫn cho đúng
import { ProductService } from '../product/product.service';

@Injectable()
export class OrderDetailsService {
  constructor(
    @InjectModel(OrderDetails.name)
    private _orderDetailsModel: Model<OrderDetails>,
    private productService: ProductService,
  ) {}

  /** 🔎 Admin xem tất cả (bỏ soft-delete) */
  async findAll(): Promise<OrderDetailsDTO[]> {
    const docs = await this._orderDetailsModel
      .find({ is_delete: false })
      .sort({ created_at: -1 })
      .lean();
    return docs.map((d) =>
      plainToInstance(
        OrderDetailsDTO,
        { id: d._id, ...d },
        { excludeExtraneousValues: true },
      ),
    );
  }

  /** 🔎 Lấy theo order_id */
  async findByOrder(order_id: string): Promise<OrderDetailsDTO[]> {
    const docs = await this._orderDetailsModel
      .find({ order_id, is_delete: false })
      .sort({ created_at: 1 })
      .lean();
    return docs.map((d) =>
      plainToInstance(
        OrderDetailsDTO,
        { id: d._id, ...d },
        { excludeExtraneousValues: true },
      ),
    );
  }

  /** 🧠 Helper: snapshot sản phẩm nếu FE chỉ gửi product_id */
  private async withProductSnapshot(i: Partial<OrderDetailsDTO>) {
    let name = i.product_name;
    let model = i.product_model;
    let photo = i.product_photo;
    let unit = i.unit_price;

    if (!name || !unit) {
      try {
        const p: any = await this.productService.findById(String(i.product_id));
        if (p) {
          name = name || p.name;
          model = model ?? p.model;
          photo = photo ?? p.photo; // LƯU TÊN FILE
          unit = unit ?? Number(p.price || 0);
        }
      } catch {
        // bỏ qua nếu không lấy được product
      }
    }

    const quantity = Number(i.quantity || 0);
    const total = Number(i.total_price ?? unit! * quantity);

    return {
      product_name: String(name || 'Unknown Product'),
      product_model: model,
      product_photo: photo,
      unit_price: Number(unit || 0),
      quantity,
      total_price: total,
    };
  }

  /** ➕ Tạo một dòng chi tiết */
  async createOne(dto: OrderDetailsDTO): Promise<OrderDetailsDTO> {
    try {
      const snap = await this.withProductSnapshot(dto);

      const payload = {
        order_id: dto.order_id,
        product_id: dto.product_id,
        ...snap,
        status: dto.status || 'Pending',
        is_active: true,
        is_delete: false,
        updated_by: dto.updated_by || 'system',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const created = await this._orderDetailsModel.create(payload);
      return plainToInstance(
        OrderDetailsDTO,
        { id: created._id, ...created.toObject() },
        { excludeExtraneousValues: true },
      );
    } catch (e: any) {
      throw new HttpException(
        { message: 'Failed to create order detail', error: e.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** ➕➕ Tạo nhiều dòng chi tiết (dùng khi tạo Order) */
  // ✅ đổi kiểu tham số items
  async createMany(
    items: Partial<OrderDetailsDTO>[],
    order_id: string,
    updated_by = 'system',
  ) {
    if (!Array.isArray(items) || items.length === 0) return [];

    const docs = [];
    for (const i of items) {
      const snap = await this.withProductSnapshot(i); // sẽ tự fill nếu thiếu tên/giá

      docs.push({
        order_id,
        product_id: i.product_id,
        ...snap, // product_name, product_model, product_photo, unit_price, quantity, total_price
        status: i.status || 'Pending',
        is_active: true,
        is_delete: false,
        updated_by,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    const created = await this._orderDetailsModel.insertMany(docs);
    return created.map((d) =>
      plainToInstance(
        OrderDetailsDTO,
        { id: d._id, ...d.toObject() },
        { excludeExtraneousValues: true },
      ),
    );
  }

  // ✅ nếu file bạn chưa có hàm này thì thêm vào:
  async updateStatusByOrder(order_id: string, status: string) {
    const res = await this._orderDetailsModel.updateMany(
      { order_id, is_delete: false },
      { $set: { status, updated_at: new Date() } },
    );
    return { msg: `Updated ${res.modifiedCount} order details to ${status}` };
  }

  /** ✏️ Cập nhật 1 dòng */
  async update(dto: OrderDetailsDTO): Promise<OrderDetailsDTO> {
    const updateData: any = {
      product_name: dto.product_name,
      product_model: dto.product_model,
      product_photo: dto.product_photo,
      unit_price: dto.unit_price,
      quantity: dto.quantity,
      total_price:
        dto.total_price ?? Number(dto.unit_price) * Number(dto.quantity),
      status: dto.status,
      updated_by: dto.updated_by || 'admin',
      updated_at: new Date(),
    };

    const updated = await this._orderDetailsModel.findByIdAndUpdate(
      dto.id,
      updateData,
      {
        new: true,
      },
    );
    if (!updated) throw new NotFoundException('Order detail not found');

    return plainToInstance(
      OrderDetailsDTO,
      { id: updated._id, ...updated.toObject() },
      { excludeExtraneousValues: true },
    );
  }

  /** 🗑️ Soft-delete theo id */
  async softDelete(id: string, updated_by: string) {
    const doc = await this._orderDetailsModel.findById(id);
    if (!doc) throw new NotFoundException('Order detail not found');

    if (doc.is_delete === true) return { msg: 'Already deleted' };

    doc.is_delete = true;
    doc.is_active = false;
    doc.updated_by = updated_by || 'admin';
    doc.updated_at = new Date();
    await doc.save();
    return { msg: 'Deleted (soft)' };
  }

  /** 🧹 Xóa mềm tất cả details của 1 đơn (nếu cần) */
  async softDeleteByOrder(order_id: string, updated_by: string) {
    await this._orderDetailsModel.updateMany(
      { order_id, is_delete: false },
      {
        $set: {
          is_delete: true,
          is_active: false,
          updated_by,
          updated_at: new Date(),
        },
      },
    );
    return { msg: 'Deleted all details of order (soft)' };
  }
}
