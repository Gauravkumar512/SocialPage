import type { Request, Response } from 'express';
import { User, type UserDocument } from '../models/User.js';
import { loginSchema, refreshSchema, registerSchema } from '../schemas/auth.schema.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/token.js';

async function issueTokens(user: UserDocument) {
  const accessToken = signAccessToken(user._id.toString());
  const refreshToken = signRefreshToken(user._id.toString());

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
}

export async function register(req: Request, res: Response) {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? 'Invalid request body';
    return res.status(400).json({ error: 'ValidationError', message });
  }

  const { username, email, password } = result.data;

  const existing = await User.findOne({ $or: [{ email }, { username }] });

  if (existing) {
    const field = existing.email === email ? 'email' : 'username';
    return res.status(409).json({ error: 'AlreadyExists', message: `That ${field} is already registered` });
  }

  const user = await User.create({ username, email, password });

  const { accessToken, refreshToken } = await issueTokens(user);

  res.status(201).json({ accessToken, refreshToken, user: user.toPublicJSON() });
}

export async function login(req: Request, res: Response) {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? 'Invalid request body';
    return res.status(400).json({ error: 'ValidationError', message });
  }

  const { email, password } = result.data;

  const user = await User.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: 'InvalidCredentials', message: 'Incorrect email or password' });
  }

  const { accessToken, refreshToken } = await issueTokens(user);

  res.json({ accessToken, refreshToken, user: user.toPublicJSON() });
}

export async function refresh(req: Request, res: Response) {
  const result = refreshSchema.safeParse(req.body);

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? 'Invalid request body';
    return res.status(400).json({ error: 'ValidationError', message });
  }

  const { refreshToken } = result.data;

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired refresh token' });
  }

  const user = await User.findById(payload.sub).select('+refreshToken');

  if (!user || !(await user.compareRefreshToken(refreshToken))) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired refresh token' });
  }

  const tokens = await issueTokens(user);

  res.json(tokens);
}

export async function logout(req: Request, res: Response) {
  const result = refreshSchema.safeParse(req.body);

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? 'Invalid request body';
    return res.status(400).json({ error: 'ValidationError', message });
  }

  const { refreshToken } = result.data;

  try {
    const payload = verifyRefreshToken(refreshToken);
    await User.findByIdAndUpdate(payload.sub, { refreshToken: null });
  } catch {
    // token already invalid/expired: nothing to revoke
  }

  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(404).json({ error: 'NotFound', message: 'User not found' });
  }

  res.json({ user: user.toPublicJSON() });
}
