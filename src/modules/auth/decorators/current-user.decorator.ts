import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';

export interface CurrentUserData {
  id: string;
  email: string;
  name: string;
  timezone: string;
  weightKg: Decimal | null;
  createdAt: Date;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
