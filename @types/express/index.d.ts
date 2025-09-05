import { User } from 'libs/database/src/entities/user.entity';

declare global {
  namespace Express {
    interface Request {
      user?: User & { email: string };
    }
  }
}
