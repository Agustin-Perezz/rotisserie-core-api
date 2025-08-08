import { DynamicModule, Global, Module } from '@nestjs/common';

import { FirebaseService } from './application/services/firebase.service';
import { FirebaseConfig } from './infrastructure/config/firebase-config.interface';

@Global()
@Module({
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {
  static forRoot(config?: FirebaseConfig): DynamicModule {
    return {
      module: FirebaseModule,
      providers: [
        {
          provide: 'FIREBASE_CONFIG',
          useValue: config || {},
        },
        FirebaseService,
      ],
      exports: [FirebaseService],
    };
  }
}
