import { SignUpDto } from '@auth/application/dto/sign-up.dto';
import { AuthService } from '@auth/application/services/auth.service';
import { Body, Controller, HttpCode, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(201)
  @Post('signup')
  async signUp(@Body() credentials: SignUpDto) {
    return this.authService.signUp(credentials);
  }
}
