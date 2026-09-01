import type { NextFunction, Request, Response } from 'express';

export function asyncHandler<Req extends Request = Request, Res extends Response = Response>(
  fn: (req: Req, res: Res, next: NextFunction) => Promise<unknown>
) {
  return function wrapped(req: Req, res: Res, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}
