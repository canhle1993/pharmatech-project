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

  // =========================================================
  // 🔹 GET ALL RANGE SETTINGS (Không lấy default)
  // =========================================================
  async findAll(): Promise<DepositSettingDTO[]> {
    const settings = await this._depositSettingModel
      .find({ is_delete: false, type: 'range' })
      .sort({ min_total: 1 })
      .lean();

    return settings.map((s) =>
      plainToInstance(DepositSettingDTO, s, { excludeExtraneousValues: true }),
    );
  }

  // =========================================================
  // 🔹 GET BY ID
  // =========================================================
  async findById(id: string): Promise<DepositSettingDTO | null> {
    const setting = await this._depositSettingModel.findById(id).lean();
    if (!setting) return null;

    return plainToInstance(DepositSettingDTO, setting, {
      excludeExtraneousValues: true,
    });
  }

  // =========================================================
  // 🔧 HELPERS
  // =========================================================
  private normalize(value: any): number {
    const num = Number(value);
    if (Number.isNaN(num)) {
      throw new HttpException('Invalid number.', HttpStatus.BAD_REQUEST);
    }
    return num;
  }

  private isOverlap(aMin: number, aMax: number, bMin: number, bMax: number) {
    return !(aMax < bMin || aMin > bMax);
  }

  private validateRange(min: number, max: number, percent: number) {
    if (min < 0 || max < 0)
      throw new HttpException('Min/Max must be >= 0', HttpStatus.BAD_REQUEST);

    if (min >= max)
      throw new HttpException(
        'Min must be less than Max',
        HttpStatus.BAD_REQUEST,
      );

    if (percent < 1 || percent > 100)
      throw new HttpException('Percent must be 1-100', HttpStatus.BAD_REQUEST);
  }

  // =========================================================
  // 🧾 CREATE RANGE SETTING
  // =========================================================
  async create(dto: DepositSettingDTO): Promise<DepositSettingDTO> {
    try {
      const min = this.normalize(dto.min_total);
      const max = this.normalize(dto.max_total);
      const percent = this.normalize(dto.percent);

      this.validateRange(min, max, percent);

      // check overlap
      const existed = await this._depositSettingModel
        .find({ is_delete: false, type: 'range' })
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

      const setting = await this._depositSettingModel.create({
        type: 'range',
        min_total: min,
        max_total: max,
        percent,
        is_active: dto.is_active ?? true,
        is_delete: false,
        updated_by: dto.updated_by || 'admin',
      });

      return plainToInstance(DepositSettingDTO, setting.toObject(), {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to create setting',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =========================================================
  // 🧾 UPDATE RANGE SETTING
  // =========================================================
  async update(dto: DepositSettingDTO): Promise<DepositSettingDTO> {
    try {
      if (!dto.id)
        throw new HttpException('Missing ID', HttpStatus.BAD_REQUEST);

      const min = this.normalize(dto.min_total);
      const max = this.normalize(dto.max_total);
      const percent = this.normalize(dto.percent);

      this.validateRange(min, max, percent);

      const existed = await this._depositSettingModel
        .find({ _id: { $ne: dto.id }, is_delete: false, type: 'range' })
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

      const updatedSetting = await this._depositSettingModel.findByIdAndUpdate(
        dto.id,
        {
          min_total: min,
          max_total: max,
          percent,
          is_active: dto.is_active,
          updated_by: dto.updated_by || 'admin',
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
        'Failed to update setting',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =========================================================
  // 🗑 SOFT DELETE
  // =========================================================
  async softDelete(id: string, updated_by: string) {
    const setting = await this._depositSettingModel.findById(id);

    if (!setting) throw new NotFoundException('Not found');

    setting.is_delete = true;
    setting.is_active = false;
    setting.updated_by = updated_by;

    await setting.save();
    return { message: 'Deleted' };
  }

  // =========================================================
  // 🔹 GET ACTIVE RANGE SETTINGS
  // =========================================================
  async findActive(): Promise<DepositSettingDTO[]> {
    const activeSettings = await this._depositSettingModel
      .find({ type: 'range', is_active: true, is_delete: false })
      .sort({ min_total: 1 })
      .lean();

    return activeSettings.map((s) =>
      plainToInstance(DepositSettingDTO, s, { excludeExtraneousValues: true }),
    );
  }

  // =========================================================
  // 🔹 GET DEFAULT SETTING
  // =========================================================
  async getDefault(): Promise<{ default_percent: number }> {
    const doc = await this._depositSettingModel
      .findOne({
        type: 'default',
        is_delete: false,
      })
      .lean();

    return { default_percent: doc?.default_percent ?? 10 };
  }

  // =========================================================
  // 🔹 UPDATE DEFAULT SETTING
  // =========================================================
  async updateDefault(default_percent: number, updated_by: string) {
    if (default_percent < 1 || default_percent > 100)
      throw new HttpException('Default must be 1–100', HttpStatus.BAD_REQUEST);

    const existing = await this._depositSettingModel.findOne({
      type: 'default',
      is_delete: false,
    });

    if (existing) {
      existing.default_percent = default_percent;
      existing.updated_by = updated_by;
      await existing.save();
      return { message: 'Default updated', default_percent };
    }

    // create default
    await this._depositSettingModel.create({
      type: 'default',
      default_percent,
      is_active: false,
      is_delete: false,
      updated_by,
    });

    return { message: 'Default created', default_percent };
  }
}
