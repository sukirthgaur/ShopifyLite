/**
 * Custom API Error Handler Class
 * Extends the native JavaScript Error class so we can throw customized exceptions inside
 * asynchronous request loops and have the global error handling middleware catch them.
 * 
 * Provides an HTTP status code alongside a list of details (e.g. schema validation fields).
 */
export class ApiError extends Error {
  // HTTP Status Code (e.g. 400, 401, 403, 404, 409, etc.)
  statusCode: number;
  
  // Specific validation field messages
  errors: string[];

  constructor(statusCode: number, message: string, errors: string[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    
    // Explicitly restore prototype chain (required for Error inheritance to work correctly in TS/ES5)
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
