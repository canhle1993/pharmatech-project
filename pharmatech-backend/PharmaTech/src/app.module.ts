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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get('connection_string'),
      }),
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
