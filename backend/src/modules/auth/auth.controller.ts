import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { registerSchema, loginSchema } from './auth.schema.js';
import * as authService from './auth.service.js';

/**
 * Authentication Module Controllers
 * Controllers process HTTP payloads, execute validation parses, invoke database services,
 * and dispatch unified JSON API responses.
 */

/**
 * Handles merchant registration requests.
 * Parses input through `registerSchema`, saves user via service, returns user metadata.
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  const result = await authService.register(data);
  res.status(201).json(new ApiResponse(true, 'User registered successfully', result));
});

/**
 * Handles merchant sign-in requests.
 * Verifies email/password structures, signs session token, and returns user/token.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  const result = await authService.login(data);
  res.status(200).json(new ApiResponse(true, 'Login successful', result));
});

/**
 * Retrieves profile properties for the logged-in request user.
 * Relies on `req.user` decoded from the `authenticate` middleware.
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const user = await authService.getProfile(userId);
  res.status(200).json(new ApiResponse(true, 'Profile retrieved successfully', user));
});
