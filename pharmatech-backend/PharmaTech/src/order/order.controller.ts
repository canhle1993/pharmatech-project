import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { OrderService } from './order.service';
import { OrderDTO } from './order.dto';
import { getImageUrl } from './config.util';

@Controller('api/order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ==================================================
  // 🧾 LẤY DỮ LIỆU
  // ==================================================

  /** 🔹 Lấy tất cả đơn hàng */
  @Get('find-all')
  async findAll() {
    try {
      return await this.orderService.findAll();
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to load orders', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** 🔹 Lấy 1 đơn hàng theo ID */
  @Get('find-by-id/:id')
  async findById(@Param('id') id: string) {
    try {
      return await this.orderService.findById(id);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to get order', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================================================
  // 🧾 TẠO ĐƠN HÀNG
  // ==================================================

  /** ✅ Tạo đơn hàng mới */
  @Post('create')
  async create(@Body() dto: OrderDTO) {
    try {
      return await this.orderService.create(dto);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to create order', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  // ✅ BỔ SUNG: CHECKOUT (tạo Order + OrderDetails)
  @Post('checkout')
  async checkout(@Body() body: any) {
    try {
      return await this.orderService.checkout(body);
    } catch (error) {
      throw new HttpException(
        { message: 'Checkout failed', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ==================================================
  // 📤 UPLOAD BIÊN LAI THANH TOÁN
  // ==================================================

  /** ✅ Upload ảnh biên lai (Payment Proof) */
  @Post('upload-proof/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './upload',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, 'proof_' + uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  async uploadProof(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const updated = await this.orderService.uploadProof(id, file);
      return {
        message: 'Payment proof uploaded successfully',
        url: getImageUrl() + file.filename,
        data: updated,
      };
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to upload proof', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================================================
  // 🔄 CẬP NHẬT TRẠNG THÁI
  // ==================================================

  /** ✅ Cập nhật trạng thái đơn hàng (Admin / hệ thống) */
  @Put('update-status/:id')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; updated_by: string },
  ) {
    try {
      const { status, updated_by } = body;
      return await this.orderService.updateStatus(id, status, updated_by);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to update status', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  /** ✅ Cập nhật trạng thái phê duyệt (approval_status) */
  @Put('update-approval/:id')
  async updateApproval(
    @Param('id') id: string,
    @Body() body: { approval_status: string; updated_by: string },
  ) {
    try {
      const { approval_status, updated_by } = body;
      return await this.orderService.updateApproval(
        id,
        approval_status,
        updated_by,
      );
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to update approval status', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ✅ BỔ SUNG: HUỶ ĐƠN (cancel order)
  @Put('cancel/:id')
  async cancel(
    @Param('id') id: string,
    @Body() body?: { cancelled_by?: 'user' | 'admin' },
  ) {
    try {
      return await this.orderService.cancelOrder(
        id,
        body?.cancelled_by ?? 'user',
      );
    } catch (error) {
      throw new HttpException(
        { message: 'Cancel order failed', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ==================================================
  // ❌ XÓA MỀM (HUỶ ĐƠN)
  // ==================================================

  /** 🔹 Xóa mềm đơn hàng */
  @Put('soft-delete/:id')
  async softDelete(
    @Param('id') id: string,
    @Body() body: { updated_by: string },
  ) {
    try {
      return await this.orderService.softDelete(id, body.updated_by);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to delete order', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Post('create-after-payment')
  async createAfterPayment(@Body() body: any) {
    return this.orderService.createAfterPayment(
      body.user_id,
      body.billing_info,
      body.carts,
      body.total_amount,
      body.deposit_amount,
    );
  }

  // PUT api/order/update-payment-info/:id
  @Put('update-payment-info/:id')
  async updatePaymentInfo(
    @Param('id') id: string,
    @Body()
    body: {
      remaining_payment_method: string;
      remaining_payment_note: string;
      payment_proof_url: string;
      updated_by: string;
      updated_at: Date;
    },
  ) {
    try {
      return await this.orderService.updatePaymentInfo(id, body);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to update payment info', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  // ==================================================
  // 📤 UPLOAD ẢNH TẠM (TEMP) — dùng cho Paid in Full Dialog
  // ==================================================
  @Post('upload-proof-temp')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './upload',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, 'proof_temp_' + uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  async uploadProofTemp(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    return {
      message: 'Temp image uploaded successfully',
      filename: file.filename,
      url: getImageUrl() + file.filename,
    };
  }

  @Put('mark-completed/:id')
  async markCompleted(
    @Param('id') id: string,
    @Body() body: { updated_by: string },
  ) {
    return await this.orderService.markCompleted(id, body.updated_by);
  }

  @Put('reject/:id')
  async rejectOrder(
    @Param('id') id: string,
    @Body()
    body: {
      cancel_reason: string;
      payment_proof_url?: string;
      updated_by: string;
    },
  ) {
    try {
      return await this.orderService.rejectOrder(id, body);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to reject order', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
