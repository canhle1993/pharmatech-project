import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { Order } from './order.decorator';
import { OrderDTO } from './order.dto';
import * as fs from 'fs';
import * as path from 'path';
import { DepositSettingService } from 'src/deposit-setting/deposit-setting.service';
import { OrderDetailsService } from 'src/order-details/order-details.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private _orderModel: Model<Order>,
    private readonly depositSettingService: DepositSettingService,
    private readonly orderDetailsService: OrderDetailsService,
  ) {}

  // ==================================================
  // 🧾 LẤY DỮ LIỆU
  // ==================================================

  /** 🔹 Lấy tất cả order (bỏ qua soft delete) */
  async findAll(): Promise<OrderDTO[]> {
    const orders = await this._orderModel
      .find({ is_delete: false })
      .sort({ createdAt: -1 })
      .lean();

    return orders.map((o) =>
      plainToInstance(OrderDTO, o, { excludeExtraneousValues: true }),
    );
  }

  /** 🔹 Lấy 1 order theo ID */
  async findById(id: string): Promise<OrderDTO> {
    const order = await this._orderModel.findById(id).lean();
    if (!order) throw new NotFoundException('Order not found');

    return plainToInstance(OrderDTO, order, {
      excludeExtraneousValues: true,
    });
  }

  // ==================================================
  // 🧾 TẠO MỚI
  // ==================================================

  /** ✅ Tạo đơn hàng mới (sau khi thanh toán Paypal hoặc xác nhận checkout) */
  async create(dto: OrderDTO): Promise<OrderDTO> {
    try {
      const order = new this._orderModel({
        user_id: dto.user_id,
        contact_name: dto.contact_name,
        contact_email: dto.contact_email,
        contact_phone: dto.contact_phone,
        contact_address: dto.contact_address,
        total_amount: dto.total_amount,
        deposit_percent: dto.deposit_percent || 10, // nếu admin chưa set => mặc định 10%
        deposit_amount: dto.deposit_amount,
        remaining_payment_amount: dto.remaining_payment_amount,
        payment_method: dto.payment_method || 'PayPal',
        paypal_order_id: dto.paypal_order_id || null,
        payment_id: dto.payment_id || null,
        items: dto.items || [],
        status: 'Deposit Paid',
        approval_status: 'Pending Approval',
        is_active: true,
        is_delete: false,
        created_at: new Date(),
        updated_at: new Date(),
        updated_by: dto.updated_by || 'system',
      });

      const created = await order.save();

      return plainToInstance(OrderDTO, created.toObject(), {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to create order', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================================================
  // 📤 UPLOAD ẢNH BIÊN LAI
  // ==================================================

  /** ✅ Upload biên lai thanh toán */
  async uploadProof(id: string, file: Express.Multer.File): Promise<OrderDTO> {
    try {
      const order = await this._orderModel.findById(id);
      if (!order) throw new NotFoundException('Order not found');

      // ✅ Nếu đã có ảnh cũ thì xóa
      if (order.payment_proof_url) {
        const oldPath = path.join(
          __dirname,
          '../../upload/',
          path.basename(order.payment_proof_url),
        );
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      order.payment_proof_url = file.filename;
      order.updated_at = new Date();
      order.updated_by = 'user';

      await order.save();

      return plainToInstance(OrderDTO, order.toObject(), {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to upload payment proof', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================================================
  // 🔄 CẬP NHẬT TRẠNG THÁI
  // ==================================================

  /** ✅ Cập nhật trạng thái đơn hàng (admin duyệt / cập nhật tiến trình) */
  async updateStatus(id: string, status: string, updated_by: string) {
    try {
      const order = await this._orderModel.findById(id);
      if (!order) throw new NotFoundException('Order not found');

      order.status = status;
      order.updated_by = updated_by;
      order.updated_at = new Date();

      await order.save();
      return { msg: `Order status updated to ${status}` };
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to update order status', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================================================
  // ❌ XÓA MỀM
  // ==================================================

  /** 🔹 Xóa mềm đơn hàng (admin hoặc user hủy) */
  async softDelete(id: string, updated_by: string) {
    const order = await this._orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    order.is_delete = true;
    order.is_active = false;
    order.cancelled_at = new Date();
    order.updated_by = updated_by;

    await order.save();
    return { msg: 'Order deleted (soft)' };
  }

  // ======================================
  // 🧾 CHECKOUT: Tạo Order + OrderDetails
  // ======================================
  async checkout(dto: any): Promise<any> {
    const { user_id, billing_info, items, total_amount } = dto;

    if (!user_id || !Array.isArray(items) || items.length === 0) {
      throw new HttpException(
        'Invalid checkout data: missing user or items',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 1️⃣ Lấy phần trăm cọc từ setting
    const settings = await this.depositSettingService.findActive();
    let deposit_percent = 10; // mặc định 10%
    const found = settings.find(
      (s) =>
        total_amount >= s.min_total &&
        total_amount <= s.max_total &&
        s.is_active,
    );
    if (found) deposit_percent = found.percent;

    const deposit_amount = (total_amount * deposit_percent) / 100;
    const remaining_payment_amount = total_amount - deposit_amount;

    // 2️⃣ Tạo order chính
    const order = new this._orderModel({
      user_id,
      contact_name: billing_info.name,
      contact_email: billing_info.email,
      contact_phone: billing_info.phone,
      contact_address: billing_info.address,
      total_amount,
      deposit_percent,
      deposit_amount,
      remaining_payment_amount,
      payment_method: 'PayPal',
      status: 'Deposit Paid',
      approval_status: 'Pending Approval',
      refund_status: 'None',
      is_active: true,
      is_delete: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const createdOrder = await order.save();

    // 3️⃣ Tạo OrderDetails (từ giỏ hàng)
    await this.orderDetailsService.createMany(
      items.map((i: any) => ({
        product_id: i.product_id, // bắt buộc
        quantity: Number(i.quantity) || 0, // bắt buộc
        unit_price: Number(i.price) || 0, // ✔ khuyến khích: chuẩn tên field
        total_price:
          Number(i.total_price) || // nếu FE đã tính sẵn thì gửi
          (Number(i.price) || 0) * (Number(i.quantity) || 0),

        // các field dưới là tùy chọn; nếu không gửi,
        // withProductSnapshot sẽ tự lấy từ ProductService:
        product_name: i.product_name,
        product_model: i.product_model,
        product_photo: i.product_photo,
        status: 'Pending',
      })),
      createdOrder._id.toString(), // ✅ order_id
      'user', // ✅ updated_by
    );

    // 4️⃣ Trả kết quả
    return {
      message: '✅ Checkout completed successfully',
      order_id: createdOrder._id,
      deposit_percent,
      deposit_amount,
      remaining_payment_amount,
      status: 'Deposit Paid',
    };
  }

  // ======================================
  // ❌ CANCEL ORDER: Huỷ đơn hàng
  // ======================================
  async cancelOrder(orderId: string, cancelled_by = 'user'): Promise<any> {
    const order = await this._orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    // Nếu đơn đã hoàn tất -> không huỷ được
    if (order.status === 'Completed' || order.status === 'Cancelled') {
      throw new HttpException(
        'This order cannot be cancelled.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Logic hoàn tiền cọc
    let refund_status = 'None';
    if (order.approval_status === 'Pending Approval') {
      refund_status = 'Deposit Refunded'; // ✅ hoàn cọc
    } else if (order.approval_status === 'Approved') {
      refund_status = 'Deposit Lost'; // ❌ mất cọc
    }

    // Cập nhật order
    order.status = 'Cancelled';
    order.refund_status = refund_status;
    order.cancelled_at = new Date();
    order.cancel_reason =
      cancelled_by === 'user' ? 'Cancelled by user' : 'Cancelled by admin';
    order.updated_at = new Date();

    await order.save();

    // Cập nhật toàn bộ OrderDetails -> Cancelled
    await this.orderDetailsService.updateStatusByOrder(
      order._id.toString(),
      'Cancelled',
    );

    return {
      message: '✅ Order cancelled successfully',
      order_id: order._id,
      refund_status,
    };
  }
}
