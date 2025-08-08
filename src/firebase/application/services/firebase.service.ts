import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';

import { IFirebaseService } from '../../domain/interfaces/firebase-service.interface';
import { FirebaseConfig } from '../../infrastructure/config/firebase-config.interface';

@Injectable()
export class FirebaseService implements OnModuleInit, IFirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: admin.app.App;

  constructor(
    @Optional() @Inject('FIREBASE_CONFIG') private config: FirebaseConfig = {},
  ) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      if (admin.apps.length === 0) {
        let credential: admin.credential.Credential;

        if (this.config.credential) {
          credential = this.config.credential;
        } else if (
          this.config.serviceAccountPath &&
          fs.existsSync(this.config.serviceAccountPath)
        ) {
          const serviceAccount = JSON.parse(
            fs.readFileSync(this.config.serviceAccountPath, 'utf8'),
          );
          credential = admin.credential.cert(serviceAccount);
        } else {
          credential = admin.credential.applicationDefault();
        }

        this.firebaseApp = admin.initializeApp({
          credential,
          databaseURL: this.config.databaseURL,
          storageBucket: this.config.storageBucket,
          projectId: this.config.projectId,
        });
        this.logger.log('Firebase initialized successfully');
      } else {
        this.firebaseApp = admin.app();
        this.logger.log('Using existing Firebase app instance');
      }
    } catch (error) {
      this.logger.error('Error initializing Firebase:', error);
      throw error;
    }
  }

  getFirebaseApp(): admin.app.App {
    return this.firebaseApp;
  }

  getAuth(): admin.auth.Auth {
    return admin.auth(this.firebaseApp);
  }
}
