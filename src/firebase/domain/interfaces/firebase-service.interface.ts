import * as admin from 'firebase-admin';

export interface IFirebaseService {
  getFirebaseApp(): admin.app.App;
  getAuth(): admin.auth.Auth;
}
