import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { environmentConfig } from '@config/environmnetConfig';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FirebaseModule } from './firebase/firebase.module';
import { ItemModule } from './item/item.module';
import { MpModule } from './mp/mp.module';
import { OrderModule } from './order/order.module';
import { PrismaModule } from './prisma/prisma.module';
import { ShopModule } from './shop/shop.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [environmentConfig],
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    ShopModule,
    ItemModule,
    OrderModule,
    MpModule,
    FirebaseModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
