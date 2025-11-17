import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReturnRequest, ReturnRequestSchema } from './return-request.decorator';
import { ReturnRequestService } from './return-request.service';
import { ReturnRequestController } from './return-request.controller';

import { OrderModule } from 'src/order/order.module';
import { OrderDetailsModule } from 'src/order-details/order-details.module';
import { ProductModule } from 'src/product/product.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReturnRequest.name, schema: ReturnRequestSchema },
    ]),
    OrderModule,
    OrderDetailsModule,
    ProductModule,
  ],
  controllers: [ReturnRequestController],
  providers: [ReturnRequestService],
  exports: [
    ReturnRequestService,
    MongooseModule.forFeature([
      { name: ReturnRequest.name, schema: ReturnRequestSchema },
    ]),
  ],
})
export class ReturnRequestModule {}
