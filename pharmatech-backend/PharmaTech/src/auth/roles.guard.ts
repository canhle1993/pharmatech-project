import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lấy quyền yêu cầu từ decorator @Roles()
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // nếu không đặt @Roles -> ai cũng vào được
    }

    // Lấy user từ request (được attach từ JWT)
    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.roles) {
      throw new ForbiddenException('Access denied: no role info found');
    }

    // Kiểm tra user có ít nhất 1 role phù hợp không
    const hasRole = user.roles.some((role: string) =>
      requiredRoles.includes(role),
    );
    if (!hasRole) {
      throw new ForbiddenException('Access denied: insufficient role');
    }

    return true;
  }
}
