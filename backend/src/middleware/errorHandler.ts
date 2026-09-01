import type { NextFunction, Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: 'NotFound', message: `No route for ${req.method} ${req.originalUrl}` });
}

interface KnownError extends Error {
  code?: string | number;
}

export function errorHandler(err: KnownError, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'InvalidJSON', message: 'Malformed JSON body' });
    return;
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: 'FileTooLarge', message: 'Image must be under 8MB' });
    return;
  }

  if (err.message === 'OnlyImagesAllowed') {
    res.status(400).json({ error: 'ValidationError', message: 'Only image files are allowed' });
    return;
  }

  if (err.message === 'EmptyPost') {
    res.status(400).json({ error: 'ValidationError', message: 'Post needs text, an image, or both' });
    return;
  }

  if (err.name === 'ValidationError' || err.name === 'CastError') {
    res.status(400).json({ error: 'ValidationError', message: err.message });
    return;
  }

  if (err.code === 11000) {
    res.status(409).json({ error: 'AlreadyExists', message: 'That value is already in use' });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'InternalServerError', message: 'Something went wrong' });
}
