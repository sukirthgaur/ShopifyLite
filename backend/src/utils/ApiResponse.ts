/**
 * Standardized API Response Wrapper
 * Creates a consistent response structure across all controllers to make it easy
 * for the frontend to consume data.
 * 
 * Consistent schema:
 * {
 *   success: boolean,
 *   message: string,
 *   data: T (generic type structure)
 * }
 */
export class ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;

  constructor(success: boolean, message: string, data?: T) {
    this.success = success;
    this.message = message;
    this.data = data;
  }
}
