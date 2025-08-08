import * as admin from 'firebase-admin';

export interface FirebaseConfig {
  credential?: admin.credential.Credential;
  databaseURL?: string;
  storageBucket?: string;
  projectId?: string;
  serviceAccountPath?: string;
}
