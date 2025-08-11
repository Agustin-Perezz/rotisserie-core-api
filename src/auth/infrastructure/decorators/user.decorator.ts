import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { IRequestWithUser } from '@/auth/domain/interfaces/types/access-token';

export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<IRequestWithUser>();
    return request.user.sub;
  },
);
