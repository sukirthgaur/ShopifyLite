import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { createUserSchema, updateUserSchema } from './user.schema.js';
import * as userService from './user.service.js';
import { parsePagination } from '../../utils/pagination.js';

/**
 * Users Module Controllers
 * Processes user registration, lookups, updates, and deletion.
 */

// POST /users - Register a new user (Restricted to SUPER_ADMIN)
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const data = createUserSchema.parse(req.body);
  const user = await userService.createUser(data);
  res.status(201).json(new ApiResponse(true, 'User created successfully', user));
});

// GET /users - Fetch user list (paginated). Tenant-isolated for STORE_ADMIN.
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const filters = {
    role: req.query.role as string | undefined,
    storeId: req.query.storeId as string | undefined,
  };
  const result = await userService.getUsers(req.user!, pagination, filters);
  res.status(200).json(new ApiResponse(true, 'Users retrieved successfully', result));
});

// GET /users/:id - Fetch user details by ID. Tenant-isolated for STORE_ADMIN.
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id as string, req.user!);
  res.status(200).json(new ApiResponse(true, 'User retrieved successfully', user));
});

// PUT /users/:id - Updates user properties (name, email, password, roles).
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const data = updateUserSchema.parse(req.body);
  const user = await userService.updateUser(req.params.id as string, data, req.user!);
  res.status(200).json(new ApiResponse(true, 'User updated successfully', user));
});

// DELETE /users/:id - Destroys user database record (restricted to SUPER_ADMIN)
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.deleteUser(req.params.id as string);
  res.status(200).json(new ApiResponse(true, 'User deleted successfully', user));
});
