import { SetMetadata } from '@nestjs/common';

// 🧩 Decorator để đánh dấu route cần quyền gì
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
