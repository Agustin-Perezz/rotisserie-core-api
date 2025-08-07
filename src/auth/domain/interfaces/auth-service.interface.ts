import { AuthCredentials, AuthToken } from './types/auth-credentials';

export interface AuthServiceInterface {
  signIn(credentials: AuthCredentials): Promise<AuthToken>;
  signUp(credentials: AuthCredentials): Promise<void>;
}
