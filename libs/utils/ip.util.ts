import { Request } from 'express';

export function getClientIp(req: Request): string {
  let ipAddr =
    (req.headers && (req.headers['x-forwarded-for'] as string)) ||
    req.ip ||
    req.socket?.remoteAddress ||
    '127.0.0.1';

  if (ipAddr.includes(',')) {
    ipAddr = ipAddr.split(',')[0].trim();
  }

  if (ipAddr === '::1' || ipAddr.startsWith('::ffff:')) {
    ipAddr = '127.0.0.1';
  }

  return ipAddr;
}
