import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type RequestUser = {
  userId: string;
  email: string;
  role: string;
  name?: string | null;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as RequestUser;
  },
);
