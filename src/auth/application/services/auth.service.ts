import { AuthServiceInterface } from '@auth/domain/interfaces/auth-service.interface';
import { AuthCredentials } from '@auth/domain/interfaces/types/auth-credentials';
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@users/application/services/users.service';

@Injectable()
export class AuthService implements AuthServiceInterface {
  constructor(
    public usersService: UsersService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  async signUp(credentials: AuthCredentials): Promise<void> {
    const user = await this.usersService.findOne(credentials.firebaseUid);

    if (user) {
      throw new ConflictException('User already exists');
    }

    await this.usersService.create({
      id: credentials.firebaseUid,
      email: credentials.email,
    });
  }
}
