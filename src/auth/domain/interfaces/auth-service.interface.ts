import { AuthCredentials } from './types/auth-credentials';

export interface AuthServiceInterface {
  signUp(credentials: AuthCredentials): Promise<void>;
}
