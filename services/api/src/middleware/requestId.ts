import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9-_]+$/;
const REQUEST_ID_MAX_LEN = 64;

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers['x-request-id'];
  let requestId: string | undefined;

  if (typeof header === 'string') {
    requestId = header.trim();
  } else if (Array.isArray(header) && header.length > 0) {
    requestId = String(header[0]).trim();
  }

  if (
    !requestId ||
    requestId.length > REQUEST_ID_MAX_LEN ||
    !REQUEST_ID_PATTERN.test(requestId)
  ) {
    requestId = randomUUID();
  }

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};
