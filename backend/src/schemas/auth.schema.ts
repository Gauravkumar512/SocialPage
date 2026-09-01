import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string({ message: 'username is required' })
    .trim()
    .min(3, 'username must be at least 3 characters')
    .max(30, 'username must be at most 30 characters'),
  email: z.string({ message: 'email is required' }).trim().toLowerCase().email('A valid email is required'),
  password: z.string({ message: 'password is required' }).min(6, 'password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.email('A valid email is required').trim().toLowerCase(),

  password: z.string({ message: 'password is required' }).min(1, 'password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string({ message: 'refreshToken is required' }).min(1, 'refreshToken is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
