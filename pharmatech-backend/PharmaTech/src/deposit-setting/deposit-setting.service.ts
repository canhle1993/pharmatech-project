import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { DepositSetting } from './deposit-setting.decorator';
import { DepositSettingDTO } from './deposit-setting.dto';

@Injectable()
export class DepositSettingService {
  constructor(
    @InjectModel(DepositSetting.name)
    private _depositSettingModel: Model<DepositSetting>,
  ) {}

  /** 🔹 Lấy tất cả cấu hình cọc (bỏ qua cái đã xóa mềm) */
  async findAll(): Promise<DepositSettingDTO[]> {
    const settings = await this._depositSettingModel
      .find({ is_delete: false })
      .sort({ created_at: -1, min_total: 1 })
      .lean();

    return settings.map((s) =>
      plainToInstance(DepositSettingDTO, s, { excludeExtraneousValues: true }),
    );
  }

  /** 🔹 Lấy 1 cấu hình cọc theo ID */
  async findById(id: string): Promise<DepositSettingDTO | null> {
    const setting = await this._depositSettingModel.findById(id).lean();
    if (!setting) return null;

    return plainToInstance(DepositSettingDTO, setting, {
      excludeExtraneousValues: true,
    });
  }

  // ==============================
  // 🔧 Helper functions
  // ==============================

  /** ✅ Chuẩn hóa giá trị số */
  private normalize(value: any): number {
    const num = Number(value);
    if (Number.isNaN(num)) {
      throw new HttpException(
        'Invalid number value in range.',
        HttpStatus.BAD_REQUEST,
      );
    }
    return num;
  }

  /** ✅ Kiểm tra trùng khoảng (overlap) */
  private isOverlap(aMin: number, aMax: number, bMin: number, bMax: number) {
    return !(aMax < bMin || aMin > bMax);
  }

  /** ✅ Kiểm tra phạm vi hợp lệ */
  private validateRange(min: number, max: number, percent: number) {
    if (min < 0 || max < 0) {
      throw new HttpException(
        'Min and max total must be ≥ 0.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (min >= max) {
      throw new HttpException(
        'Min total must be less than max total.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (percent < 1 || percent > 100) {
      throw new HttpException(
        'Percent must be between 1 and 100.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ==============================
  // 🧾 CREATE
  // ==============================
  async create(dto: DepositSettingDTO): Promise<DepositSettingDTO> {
    try {
      const min = this.normalize(dto.min_total);
      const max = this.normalize(dto.max_total);
      const percent = this.normalize(dto.percent);
      this.validateRange(min, max, percent);

      // 🔍 Kiểm tra overlap
      const existed = await this._depositSettingModel
        .find({ is_delete: false })
        .lean();

      const conflict = existed.find((s) =>
        this.isOverlap(min, max, s.min_total, s.max_total),
      );
      if (conflict) {
        throw new HttpException(
          `Range overlaps existing setting [${conflict.min_total} – ${conflict.max_total}] (${conflict.percent}%).`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // ✅ Tạo mới
      const setting = new this._depositSettingModel({
        min_total: min,
        max_total: max,
        percent,
        is_active: dto.is_active ?? true,
        is_delete: false,
        updated_by: dto.updated_by || 'admin',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const created = await setting.save();
      return plainToInstance(DepositSettingDTO, created.toObject(), {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { message: 'Failed to create deposit setting', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==============================
  // 🧾 UPDATE
  // ==============================
  async update(dto: DepositSettingDTO): Promise<DepositSettingDTO> {
    try {
      if (!dto.id)
        throw new HttpException(
          'Missing ID for update',
          HttpStatus.BAD_REQUEST,
        );

      const min = this.normalize(dto.min_total);
      const max = this.normalize(dto.max_total);
      const percent = this.normalize(dto.percent);
      this.validateRange(min, max, percent);

      // 🔍 Kiểm tra overlap (ngoại trừ chính nó)
      const existed = await this._depositSettingModel
        .find({ _id: { $ne: dto.id }, is_delete: false })
        .lean();

      const conflict = existed.find((s) =>
        this.isOverlap(min, max, s.min_total, s.max_total),
      );
      if (conflict) {
        throw new HttpException(
          `Range overlaps existing setting [${conflict.min_total} – ${conflict.max_total}] (${conflict.percent}%).`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // ✅ Cập nhật
      const updatedSetting = await this._depositSettingModel.findByIdAndUpdate(
        dto.id,
        {
          min_total: min,
          max_total: max,
          percent,
          is_active: dto.is_active,
          updated_by: dto.updated_by || 'admin',
          updated_at: new Date(),
        },
        { new: true },
      );

      if (!updatedSetting)
        throw new NotFoundException('Deposit setting not found');

      return plainToInstance(DepositSettingDTO, updatedSetting.toObject(), {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { message: 'Failed to update deposit setting', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==============================
  // 🗑️ SOFT DELETE
  // ==============================
  async softDelete(id: string, updated_by: string): Promise<any> {
    const setting = await this._depositSettingModel.findById(id);
    if (!setting) throw new NotFoundException('Deposit setting not found');

    if (setting.is_delete === true) return { msg: 'Already deleted' };

    setting.is_delete = true;
    setting.is_active = false;
    setting.updated_by = updated_by;
    setting.updated_at = new Date();

    await setting.save();
    return { msg: 'Deleted (soft)' };
  }

  // ==============================
  // 🔹 Lấy cấu hình đang active
  // ==============================
  async findActive(): Promise<DepositSettingDTO[]> {
    const activeSettings = await this._depositSettingModel
      .find({ is_active: true, is_delete: false })
      .sort({ min_total: 1 })
      .lean();

    return activeSettings.map((s) =>
      plainToInstance(DepositSettingDTO, s, { excludeExtraneousValues: true }),
    );
  }
}
