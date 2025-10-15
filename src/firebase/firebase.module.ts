import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FirebaseService } from './application/services/firebase.service';
import { FirebaseConfig } from './infrastructure/config/firebase-config.interface';

@Global()
@Module({})
export class FirebaseModule {
  static forRoot(config?: FirebaseConfig): DynamicModule {
    return {
      module: FirebaseModule,
      providers: [
        {
          provide: 'FIREBASE_CONFIG',
          useFactory: (configService: ConfigService) => {
            const projectId = configService.get<string>('firebase.projectId');
            const storageBucket = configService.get<string>(
              'firebase.storageBucket',
            );
            const serviceAccountPath = configService.get<string>(
              'firebase.serviceAccountPath',
            );

            return (
              config || {
                projectId: projectId || '',
                storageBucket: storageBucket || '',
                serviceAccountPath: serviceAccountPath || '',
              }
            );
          },
          inject: [ConfigService],
        },
        FirebaseService,
      ],
      exports: [FirebaseService],
    };
  }
}
