import { SetMetadata } from '@nestjs/common';

// This is a "key" to save and retrieve the list of roles
export const ROLES_KEY = 'roles';

// Decorator @Roles('admin', 'staff') will attach metadata ['admin', 'staff'] to the API
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
