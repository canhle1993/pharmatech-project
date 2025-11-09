import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DepositSetting,
  DepositSettingSchema,
} from './deposit-setting.decorator';
import { DepositSettingService } from './deposit-setting.service';
import { DepositSettingController } from './deposit-setting.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DepositSetting.name, schema: DepositSettingSchema },
    ]),
  ],
  controllers: [DepositSettingController],
  providers: [DepositSettingService],
  exports: [
    MongooseModule.forFeature([
      { name: DepositSetting.name, schema: DepositSettingSchema }, // ✅ Export model để module khác (Cart, Order) có thể sử dụng
    ]),
  ],
})
export class DepositSettingModule {}
