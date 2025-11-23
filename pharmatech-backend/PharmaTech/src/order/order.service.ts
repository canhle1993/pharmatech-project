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
import { CartService } from 'src/cart/cart.service';
import { MailService } from 'src/mail/mail.service';
import { AccountService } from 'src/account/account.service';
import { ProductService } from 'src/product/product.service';
import { OrderGateway } from './order.gateway';
import { OrderDetails } from 'src/order-details/order-details.decorator';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private _orderModel: Model<Order>,

    @InjectModel(OrderDetails.name) // ⬅⬅⬅ THÊM DÒNG NÀY
    private readonly orderDetailsModel: Model<OrderDetails>, // ⬅⬅⬅ THÊM

    private readonly depositSettingService: DepositSettingService,
    private readonly orderDetailsService: OrderDetailsService,
    private readonly cartService: CartService,
    private readonly mailService: MailService,
    private readonly accountService: AccountService,
    private readonly productService: ProductService,
    private readonly orderGateway: OrderGateway,
  ) {}

  // ==================================================
  // 🧾 LẤY DỮ LIỆU
  // ==================================================

  /** 🔹 Lấy tất cả order (bỏ qua soft delete) */
  async findAll(): Promise<OrderDTO[]> {
    // ✅ Lấy tất cả đơn chưa bị xóa, có _id
    const orders = await this._orderModel
      .find({ is_delete: false })
      .sort({ updated_at: -1, created_at: -1 })
      .lean();

    // ✅ Thêm field id để Angular có thể sử dụng
    const withId = orders.map((o) => ({
      ...o,
      id: o._id?.toString(),
    }));

    // ✅ Dùng lại DTO để format chuẩn cho frontend
    return plainToInstance(OrderDTO, withId, { excludeExtraneousValues: true });
  }

  /** 🔹 Lấy 1 order theo ID */
  // 🧾 order.service.ts
  // 📌 order.service.ts
  async findById(id: string) {
    try {
      // 1) Lấy order chính
      const order = await this._orderModel.findById(id).lean();
      if (!order) throw new NotFoundException('Order not found');

      // 2) Lấy thông tin user đặt hàng
      const account = await this.accountService.findById(order.user_id);
      const user_info = {
        name: account?.name || null,
        email: account?.email || null,
        phone: account?.phone || null,
        address: account?.address || null,
      };

      // 3) Lấy danh sách sản phẩm trong đơn
      const details = await this.orderDetailsService.findByOrder(
        order._id.toString(),
      );

      // 4) Trả về đầy đủ
      return {
        ...order,
        id: order._id.toString(),
        details,
        user_info,
      };
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to load order details', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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

      // 🟢 Emit Socket: có đơn hàng mới
      this.orderGateway.emitNewOrder(created);

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
  // src/order/order.service.ts
  async updateStatus(id: string, status: string, updated_by: string) {
    try {
      const order = await this._orderModel.findById(id);
      if (!order) throw new NotFoundException('Order not found');

      const oldStatus = order.status;

      order.status = status;
      order.updated_by = updated_by;
      order.updated_at = new Date();

      await order.save();

      // 🟡 Emit socket: trạng thái thay đổi
      this.orderGateway.emitOrderStatusChanged({
        id: id,
        from: oldStatus,
        to: status,
      });

      // ✅ Nếu đơn hàng đã thanh toán đủ -> cập nhật OrderDetails
      if (status === 'Paid in Full') {
        await this.orderDetailsService.updateStatusByOrder(
          id,
          'Preparing', // 👉 tất cả sản phẩm trong đơn chuyển thành "Preparing"
        );
      }

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

    // 🟢 Emit socket: có đơn hàng mới
    this.orderGateway.emitNewOrder(createdOrder);

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
  async createAfterPayment(
    user_id: string,
    billing_info: any,
    carts: any[],
    total_amount: number,
    deposit_amount: number,
  ) {
    try {
      // 0️⃣ Validate carts
      if (!carts || !carts.length) {
        throw new HttpException('Cart is empty', HttpStatus.BAD_REQUEST);
      }

      // 1️⃣ Tính toán thêm
      const deposit_percent = Math.round((deposit_amount / total_amount) * 100);
      const remaining_payment_amount = total_amount - deposit_amount;

      // 2️⃣ Tạo order chính
      const orderPayload = {
        user_id,
        contact_name: billing_info?.name,
        contact_email: billing_info?.email,
        contact_phone: billing_info?.phone,
        contact_address: billing_info?.address,
        total_amount,
        deposit_percent,
        deposit_amount,
        remaining_payment_amount,
        payment_method: 'Stripe',
        status: 'Deposit Paid',
        approval_status: 'Pending Approval',
        refund_status: 'None',
        is_active: true,
        is_delete: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const order = await this._orderModel.create(orderPayload);
      // 🟢 Emit socket: đơn mới (Stripe)
      this.orderGateway.emitNewOrder(order);

      // 3️⃣ Tạo OrderDetails
      const detailsPayload = carts.map((c) => ({
        order_id: order._id.toString(),
        product_id: c.product_id._id || c.product_id,
        quantity: c.quantity,
        unit_price: c.price,
        total_price: c.price * c.quantity,
        status: 'Pending',
      }));

      await this.orderDetailsService.createMany(
        detailsPayload,
        order._id.toString(),
        'system',
      );

      // 4️⃣ Xóa cart trong DB
      await this.cartService.clearUserCart(user_id);

      // ===============================================
      // 📧 GỬI EMAIL XÁC NHẬN ĐƠN HÀNG
      // ===============================================
      try {
        const to = billing_info?.email || 'aplevancanh1993@gmail.com';
        const subject = `Order Confirmation - #${order._id}`;

        await this.mailService.send4(
          'aplevancanh1993@gmail.com', // from
          to, // to
          subject,
          'order-confirmation', // template .hbs
          {
            name: billing_info?.name || 'Customer',
            payment_method: 'Stripe',
            order_id: order._id,
            total_amount: order.total_amount,
            deposit_amount: order.deposit_amount,
            deposit_percent: order.deposit_percent,
            remaining_payment_amount: order.remaining_payment_amount,
          },
        );

        console.log('📧 [Mail] Order confirmation sent successfully');
      } catch (mailErr) {
        console.error('❌ [Mail] Failed to send confirmation email:', mailErr);
      }

      return {
        message: 'Order created successfully',
        order_id: order._id,
      };
    } catch (error) {
      console.error('❌ [createAfterPayment ERROR]', error);
      throw new HttpException(
        'Failed to create order: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** ✅ Cập nhật approval_status (Admin duyệt hoặc từ chối) */
  async updateApproval(
    id: string,
    approval_status: string,
    updated_by: string,
  ) {
    try {
      const order = await this._orderModel.findById(id);
      if (!order) throw new NotFoundException('Order not found');

      const currentStatus = order.approval_status;

      order.approval_status = approval_status;
      order.updated_by = updated_by;
      order.updated_at = new Date();

      await order.save();
      this.orderGateway.emitOrderStatusChanged({
        id,
        from: currentStatus,
        to: approval_status,
      });

      // ✅ Nếu admin duyệt đơn
      if (approval_status === 'Approved') {
        // 👉 Toàn bộ sản phẩm trong OrderDetails => Preparing
        await this.orderDetailsService.updateStatusByOrder(id, 'Preparing');
      }

      return { msg: `Order approval updated to ${approval_status}` };
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to update order approval', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updatePaymentInfo(
    id: string,
    body: {
      remaining_payment_method: string;
      remaining_payment_note: string;
      payment_proof_url: string;
      updated_by: string;
      updated_at: Date;
    },
  ) {
    const {
      remaining_payment_method,
      remaining_payment_note,
      payment_proof_url,
      updated_by,
    } = body;

    const order = await this._orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    const oldStatus = order.status;

    order.remaining_payment_method = remaining_payment_method;
    order.remaining_payment_note = remaining_payment_note;
    order.payment_proof_url = payment_proof_url;
    order.remaining_payment_date = new Date(); // 🟢 ngày hiện tại
    order.status = 'Paid in Full';
    order.updated_by = updated_by;
    order.paid_at = new Date();
    order.updated_at = new Date();

    await order.save();

    this.orderGateway.emitOrderStatusChanged({
      id,
      from: oldStatus,
      to: 'Paid in Full',
    });

    // 🟦 Update OrderDetails → Completed (hoặc giữ Preparing tùy bạn)
    await this.orderDetailsService.updateStatusByOrder(id, 'Preparing');

    return { msg: 'Payment info updated successfully' };
  }

  async markCompleted(orderId: string, updated_by: string) {
    try {
      const order = await this._orderModel.findById(orderId);
      if (!order) throw new NotFoundException('Order not found');

      const oldStatus = order.status;
      // Update Order
      order.status = 'Completed';
      order.updated_by = updated_by;
      order.updated_at = new Date();

      await order.save();

      this.orderGateway.emitOrderStatusChanged({
        id: orderId,
        from: oldStatus,
        to: 'Completed',
      });

      // Update all order details
      await this.orderDetailsService.updateStatusByOrder(orderId, 'Delivered');

      return { msg: 'Order marked as Completed, all items set to Delivered' };
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to mark completed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 🚫 Reject Order (Admin hoặc User)
   * Logic:
   * - Nếu Pending Approval → hoàn cọc (Deposit Refunded)
   * - Nếu Approved → mất cọc (None)
   */
  async rejectOrder(
    id: string,
    body: {
      cancel_reason: string;
      payment_proof_url?: string;
      updated_by: string;
    },
  ) {
    const { cancel_reason, payment_proof_url, updated_by } = body;

    const order = await this._orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    const now = new Date();

    // 🟢 LẤY oldStatus TRƯỚC KHI ĐỔI
    const oldStatus = order.approval_status; // <<<  FIX HERE

    // ============================================
    // 1) PENDING APPROVAL => REJECTED (hoàn cọc)
    // ============================================
    if (oldStatus === 'Pending Approval') {
      order.approval_status = 'Rejected';
      order.refund_status = 'Deposit Refunded';
      order.status = 'Refunded'; // <<< THÊM DÒNG NÀY
      order.cancel_reason = cancel_reason;
      order.payment_proof_url = payment_proof_url || null;
      order.cancelled_at = now;
      order.refund_time = now;
    }

    // ============================================
    // 2) APPROVED => REJECTED (mất cọc)
    // ============================================
    else if (oldStatus === 'Approved') {
      order.approval_status = 'Rejected';
      order.refund_status = 'Deposit Lost';
      order.status = 'Cancelled'; // <<< THÊM DÒNG NÀY
      order.cancel_reason = cancel_reason;
      order.cancelled_at = now;
      order.refund_time = now;
    } else {
      throw new HttpException(
        'This order cannot be rejected.',
        HttpStatus.BAD_REQUEST,
      );
    }

    order.updated_by = updated_by;
    order.updated_at = now;

    await order.save();

    // 🟡 Emit realtime đúng giá trị
    this.orderGateway.emitOrderStatusChanged({
      id,
      from: oldStatus, // Pending Approval
      to: 'Rejected', // Rejected
    });

    // update order details
    await this.orderDetailsService.updateStatusByOrder(id, 'Cancelled');

    // restore stock
    const details = await this.orderDetailsService.findByOrder(id);
    for (const d of details) {
      await this.productService.increaseStock(d.product_id, d.quantity);
    }

    return {
      msg: 'Order rejected successfully',
      approval_status: order.approval_status,
      refund_status: order.refund_status,
    };
  }

  async countPending(): Promise<number> {
    return this._orderModel.countDocuments({
      approval_status: 'Pending Approval',
      is_delete: false,
    });
  }

  // =======================
  // 📌 BIỂU ĐỒ DOANH THU THEO CATEGORY + NGÀY
  // =======================
  async getRevenueByCategoryAndDate() {
    const result = await this.orderDetailsModel.aggregate([
      // 1) JOIN Orders
      {
        $lookup: {
          from: 'orders',
          let: { oid: '$order_id' },
          pipeline: [
            { $addFields: { orderIdString: { $toString: '$_id' } } },
            { $match: { $expr: { $eq: ['$orderIdString', '$$oid'] } } },
          ],
          as: 'order',
        },
      },
      { $unwind: '$order' },

      // 2) JOIN ProductCategory
      {
        $lookup: {
          from: 'product_categories',
          let: { pid: '$product_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$product_id', { $toObjectId: '$$pid' }],
                },
              },
            },
          ],
          as: 'pc',
        },
      },
      { $unwind: '$pc' },

      // 3) JOIN Category
      {
        $lookup: {
          from: 'categorys',
          localField: 'pc.category_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },

      // 4) Filter đơn hợp lệ
      {
        $match: {
          'order.status': { $in: ['Paid in Full', 'Completed'] },
          'order.is_delete': false,
        },
      },

      // 5) Group theo category + date
      {
        $group: {
          _id: {
            category: '$category.name',
            date: {
              $dateToString: { format: '%Y-%m-%d', date: '$order.created_at' },
            },
          },
          totalRevenue: { $sum: '$total_price' },
        },
      },

      // 6) Format output
      {
        $project: {
          _id: 0,
          category: '$_id.category',
          date: '$_id.date',
          totalRevenue: 1,
        },
      },

      // 7) Sort theo ngày
      { $sort: { date: 1 } },
    ]);

    return result;
  }

  // =======================
  // 📌 TOP 10 PRODUCT BÁN CHẠY THEO tháng
  // =======================
  async getTop10ProductsByDate(): Promise<any[]> {
    try {
      const endDate = new Date(); // hôm nay
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // 30 ngày trước

      const result = await this.orderDetailsModel.aggregate([
        // 1) JOIN Order
        {
          $lookup: {
            from: 'orders',
            let: { oid: '$order_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', { $toObjectId: '$$oid' }] },
                  is_delete: false,
                  status: { $in: ['Paid in Full', 'Completed'] },
                  created_at: { $gte: startDate, $lte: endDate }, // ⭐ LỌC 30 NGÀY
                },
              },
            ],
            as: 'order',
          },
        },

        { $unwind: '$order' },

        // 2) GROUP THEO PRODUCT
        {
          $group: {
            _id: '$product_id',
            totalQuantity: { $sum: '$quantity' },
          },
        },

        { $sort: { totalQuantity: -1 } },
        { $limit: 10 },

        // 3) JOIN PRODUCT
        {
          $lookup: {
            from: 'products',
            let: { pid: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', { $toObjectId: '$$pid' }] },
                },
              },
            ],
            as: 'product',
          },
        },

        { $unwind: '$product' },

        // 4) FORMAT OUTPUT
        {
          $project: {
            _id: 0,
            product_id: '$_id',
            name: '$product.name',
            model: '$product.model',
            photo: '$product.photo',
            totalQuantity: 1,
          },
        },
      ]);

      return result;
    } catch (err) {
      throw new HttpException(
        {
          message: 'Failed to load top products (30 days)',
          error: err.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
