import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import * as admin from 'firebase-admin';

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
        const credential = admin.credential.cert(
          this.config.serviceAccountPath!,
        );

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

  getStorage(): admin.storage.Storage {
    return admin.storage(this.firebaseApp);
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    try {
      if (!this.config.storageBucket) {
        throw new Error(
          'Storage bucket not configured. Please set FIREBASE_STORAGE_BUCKET environment variable.',
        );
      }

      const bucket = this.getStorage().bucket(this.config.storageBucket);
      const fileName = `${folder}/${Date.now()}_${file.originalname}`;
      const fileUpload = bucket.file(fileName);

      await fileUpload.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
      });

      await fileUpload.makePublic();

      const publicUrl = `${this.config.publicUrlBase}/${bucket.name}/${fileName}`;
      return publicUrl;
    } catch (error) {
      this.logger.error('Error uploading file to Firebase Storage:', error);
      throw error;
    }
  }
  async uploadFiles(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map(async (file) => {
        return await this.uploadFile(file, folder);
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      this.logger.error('Error uploading files to Firebase Storage:', error);
      throw error;
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const bucket = this.getStorage().bucket(this.config.storageBucket);
      const baseUrl = `${this.config.publicUrlBase}/${bucket.name}/`;

      if (!fileUrl.startsWith(baseUrl)) {
        this.logger.warn(`File URL does not match expected format: ${fileUrl}`);
        return;
      }

      const filePath = fileUrl.replace(baseUrl, '');
      const file = bucket.file(decodeURIComponent(filePath));

      await file.delete();
    } catch (error) {
      this.logger.error('Error deleting file from Firebase Storage:', error);
      throw error;
    }
  }
}
