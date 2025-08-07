import { Request } from 'express';

export interface IJwtPayload {
  email: string;
  sub: string;
}

export interface IRequestWithUser extends Request {
  user: IJwtPayload;
}
