import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { ReturnRequest } from './return-request.decorator';
import { ReturnRequestDTO } from './return-request.dto';

import { OrderService } from 'src/order/order.service';
import { OrderDetailsService } from 'src/order-details/order-details.service';
import { ProductService } from 'src/product/product.service';

@Injectable()
export class ReturnRequestService {
  constructor(
    @InjectModel(ReturnRequest.name)
    private _returnModel: Model<ReturnRequest>,
    private readonly orderService: OrderService,
    private readonly orderDetailsService: OrderDetailsService,
    private readonly productService: ProductService,
  ) {}

  // ==================================================
  // 🧾 LẤY DỮ LIỆU
  // ==================================================

  /** 🔹 Lấy tất cả yêu cầu đổi hàng (có thể filter theo status ở FE) */
  async findAll(): Promise<ReturnRequestDTO[]> {
    const list = await this._returnModel
      .find({ is_delete: false })
      .sort({ updated_at: -1, created_at: -1 })
      .lean();

    return plainToInstance(ReturnRequestDTO, list, {
      excludeExtraneousValues: true,
    });
  }

  /** 🔹 Lấy theo ID */
  async findById(id: string): Promise<ReturnRequestDTO> {
    const doc = await this._returnModel.findById(id).lean();
    if (!doc) throw new NotFoundException('Return request not found');

    return plainToInstance(ReturnRequestDTO, doc, {
      excludeExtraneousValues: true,
    });
  }

  /** 🔹 Lấy theo trạng thái (Pending Manufacturer, Completed, ...) */
  async findByStatus(status: string): Promise<ReturnRequestDTO[]> {
    const list = await this._returnModel
      .find({ status, is_delete: false })
      .sort({ updated_at: -1, created_at: -1 })
      .lean();

    return plainToInstance(ReturnRequestDTO, list, {
      excludeExtraneousValues: true,
    });
  }

  // ==================================================
  // ➕ TẠO YÊU CẦU ĐỔI HÀNG
  // ==================================================

  /**
   * ✅ Tạo yêu cầu đổi hàng
   * - Chỉ cho phép từ Order có status = Completed
   * - Trừ stock của sản phẩm mới (replacement_product)
   * - Lưu snapshot các item lỗi
   */
  async create(payload: any): Promise<ReturnRequestDTO> {
    const {
      order_id,
      order_detail_ids,
      replacement_product_id,
      reason,
      damage_photos,
      updated_by,
      items, // ⬅ FE gửi vào
    } = payload;

    if (
      !order_id ||
      !Array.isArray(order_detail_ids) ||
      !order_detail_ids.length
    ) {
      throw new HttpException(
        'order_id and order_detail_ids are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new HttpException(
        'Return items are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 1️⃣ Lấy order gốc
    const order: any = await this.orderService.findById(order_id);
    if (!order) throw new NotFoundException('Order not found');

    if (order.status !== 'Completed') {
      throw new HttpException(
        'Only orders with status Completed are allowed for returns',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2️⃣ Lấy OrderDetails gốc
    const details = await this.orderDetailsService.findByOrder(order_id);

    const selectedDetails = details
      .map((d: any) => ({
        ...d,
        id: d.id ?? d._id?.toString(),
      }))
      .filter((d: any) => order_detail_ids.includes(String(d.id)));

    if (!selectedDetails.length) {
      throw new HttpException(
        'No valid products found for return',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 3️⃣ Tính tổng quantity return theo FE
    const total_quantity = items.reduce(
      (sum: number, i: any) => sum + Number(i.quantity || 0),
      0,
    );

    if (total_quantity <= 0) {
      throw new HttpException(
        'Total return quantity must be greater than 0',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 4️⃣ Lấy sản phẩm thay thế
    const replacement: any = await this.productService.findById(
      replacement_product_id,
    );
    if (!replacement)
      throw new NotFoundException('Replacement product not found');

    // 5️⃣ Trừ stock theo qty return (đã fix)
    await this.productService.reduceStock(
      replacement_product_id,
      total_quantity,
    );

    // 6️⃣ Build snapshot items (DÙNG QUANTITY RETURN THAY VÌ ORDERED QUANTITY)
    const itemsSnapshot = selectedDetails.map((d: any) => {
      const found = items.find((x: any) => x.order_detail_id === String(d.id));
      return {
        order_detail_id: d.id,
        product_id: d.product_id,
        product_name: d.product_name,
        product_model: d.product_model,
        product_photo: d.product_photo,
        quantity: found?.quantity ?? 0, // ⬅ FIX tại đây
        unit_price: d.unit_price,
        total_price: (found?.quantity ?? 0) * d.unit_price,
      };
    });

    // 7️⃣ Lưu DB
    const doc = new this._returnModel({
      order_id,
      user_id: order.user_id,
      items: itemsSnapshot,
      replacement_product_id,
      replacement_product_name: replacement.name,
      replacement_product_model: replacement.model,
      replacement_product_photo: replacement.photo,
      replacement_unit_price: replacement.price,
      total_quantity,
      reason,
      damage_photos: damage_photos || [],
      status: 'Pending Manufacturer',
      is_active: true,
      is_delete: false,
      updated_by: updated_by || 'admin',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const created = await doc.save();

    return plainToInstance(ReturnRequestDTO, created.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  // ==================================================
  // 🔄 CẬP NHẬT TRẠNG THÁI
  // ==================================================

  /** ✅ Admin đánh dấu đã nhận hàng mới từ NSX → Completed + cộng lại stock */
  async markCompleted(id: string, updated_by: string) {
    const doc = await this._returnModel.findById(id);
    if (!doc) throw new NotFoundException('Return request not found');

    if (doc.status !== 'Pending Manufacturer') {
      throw new HttpException(
        'Only return requests with status Pending Manufacturer can be completed',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 1️⃣ Cộng lại stock cho sản phẩm mới (vì NSX đã gửi hàng bù)
    await this.productService.updateStock(
      doc.replacement_product_id,
      doc.total_quantity,
      updated_by || 'admin',
    );

    // 2️⃣ Cập nhật trạng thái
    doc.status = 'Completed';
    doc.updated_by = updated_by || 'admin';
    doc.updated_at = new Date();

    await doc.save();

    return { msg: 'Return request marked as Completed' };
  }

  /** ❌ Soft delete */
  async softDelete(id: string, updated_by: string) {
    const doc = await this._returnModel.findById(id);
    if (!doc) throw new NotFoundException('Return request not found');

    if (doc.is_delete === true) return { msg: 'Already deleted' };

    doc.is_delete = true;
    doc.is_active = false;
    doc.updated_by = updated_by || 'admin';
    doc.updated_at = new Date();

    await doc.save();

    return { msg: 'Return request deleted (soft)' };
  }
}
