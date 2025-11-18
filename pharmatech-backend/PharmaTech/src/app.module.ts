import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { AccountModule } from './account/account.module';
import { MailModule } from './mail/mail.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { CareerModule } from './career/career.module';
import { ProductCategoryModule } from './product-category/product-category.module';
import { ProductImageModule } from './product-image/product-image.module';
import { AboutModule } from './about/about.module';
import { ContactModule } from './contact/contact.module';
import { HotlineModule } from './hotline/hotline.module';
import { ChatModule } from './chat/chat.module';
import { HomeCategoryModule } from './settingHomeCategory/homeCategory.module';
import { CartModule } from './cart/cart.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { OrderDetailsModule } from './order-details/order-details.module';
import { OrderModule } from './order/order.module';
import { DepositSettingModule } from './deposit-setting/deposit-setting.module';
import { StripeModule } from './stripe/stripe.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { ApplicationModule } from './application/application.module';
import { OcrModule } from './ocr/ocr.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReturnRequestModule } from './return-request/return-request.module';
import { QuoteModule } from './quote/quote.module';
import { BannerModule } from './banner/banner.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get('connection_string');
        console.log('🔗 Connected Mongo URI:', uri); // 👉 In ra đường dẫn thật
        return { uri };
      },
    }),

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get('mail_host'),
          port: configService.get('mail_port'),
          secure: configService.get('mail_starttls'),
          auth: {
            user: configService.get('mail_username'),
            pass: configService.get('mail_password'),
          },
        },
        template: {
          dir: join(__dirname, '..', 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
    AccountModule,
    MailModule,
    CategoryModule,
    ProductModule,
    CareerModule,
    ProductCategoryModule,
    ProductImageModule,
    AboutModule,
    ContactModule,
    HotlineModule,
    ChatModule,
    HomeCategoryModule,
    CartModule,
    WishlistModule,
    DepositSettingModule,
    OrderModule,
    OrderDetailsModule,
    StripeModule,
    AiModule,
    ApplicationModule,
    AuthModule,
    OcrModule,
    AnalyticsModule,
    ReturnRequestModule,
    QuoteModule,
    BannerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
