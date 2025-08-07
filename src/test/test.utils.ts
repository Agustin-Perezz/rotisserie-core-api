import { IJwtPayload } from '@auth/domain/interfaces/types/access-token';
import { jwtConstants } from '@auth/infrastructure/constanst/jwt-constants';
import { JwtService } from '@nestjs/jwt';

const jwtService = new JwtService({ secret: jwtConstants.secret });

export const createAccessToken = (payload: IJwtPayload): Promise<string> => {
  return jwtService.signAsync(payload);
};
