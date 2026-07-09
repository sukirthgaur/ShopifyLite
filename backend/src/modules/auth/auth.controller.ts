import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { registerSchema, loginSchema } from './auth.schema.js';
import * as authService from './auth.service.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  const user = await authService.register(data);
  res.status(201).json(new ApiResponse(true, 'User registered successfully', user));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  const result = await authService.login(data);
  res.status(200).json(new ApiResponse(true, 'Login successful', result));
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const user = await authService.getProfile(userId);
  res.status(200).json(new ApiResponse(true, 'Profile retrieved successfully', user));
});
