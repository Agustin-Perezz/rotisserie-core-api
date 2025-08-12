import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FirebaseModule } from './firebase/firebase.module';
import { ItemModule } from './item/item.module';
import { PrismaModule } from './prisma/prisma.module';
import { ShopModule } from './shop/shop.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    ShopModule,
    ItemModule,
    FirebaseModule.forRoot({
      projectId: process.env.FIREBASE_PROJECT_ID,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
