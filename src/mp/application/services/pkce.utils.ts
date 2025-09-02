import { createHash, randomBytes } from 'crypto';

export class PkceUtils {
  static generateCodeVerifier(): string {
    return randomBytes(32).toString('base64url');
  }

  static generateCodeChallenge(codeVerifier: string): string {
    return createHash('sha256').update(codeVerifier).digest('base64url');
  }
}
