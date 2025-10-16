import * as admin from 'firebase-admin';

export interface IFirebaseService {
  getFirebaseApp(): admin.app.App;
  getAuth(): admin.auth.Auth;
  getStorage(): admin.storage.Storage;
  uploadFile(file: Express.Multer.File, folder: string): Promise<string>;
  deleteFile(fileUrl: string): Promise<void>;
}
