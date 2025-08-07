import { AuthServiceInterface } from '@auth/domain/interfaces/auth-service.interface';
import { AuthCredentials } from '@auth/domain/interfaces/types/auth-credentials';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@users/application/services/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService implements AuthServiceInterface {
  constructor(
    public usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signUp(credentials: AuthCredentials): Promise<void> {
    const user = await this.usersService.findByEmail(credentials.email);

    if (user) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await this.hashPassword(credentials.password);
    await this.usersService.create({
      email: credentials.email,
      password: hashedPassword,
    });
  }

  async signIn(user: AuthCredentials) {
    const isValidUser = await this.validateUser(user.email, user.password);

    if (!isValidUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userId = isValidUser.id;
    const payload = { email: user.email, sub: userId };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async validateUser(
    email: string,
    pass: string,
  ): Promise<{
    email: string;
    id: number;
  } | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      return { email: user.email, id: user.id };
    }
    return null;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
