export class AppError extends Error {
  constructor(status, message, code = 'ERROR', details = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) => new AppError(400, message, 'BAD_REQUEST', details);
export const unauthorized = (message = 'Authentication required') => new AppError(401, message, 'UNAUTHORIZED');
export const forbidden = (message = 'You cannot perform this action') => new AppError(403, message, 'FORBIDDEN');
export const notFound = (message = 'Not found') => new AppError(404, message, 'NOT_FOUND');
export const conflict = (message) => new AppError(409, message, 'CONFLICT');
export const tooLarge = (message = 'File is too large') => new AppError(413, message, 'PAYLOAD_TOO_LARGE');
export const badGateway = (message = 'Image storage service failed') => new AppError(502, message, 'IMAGE_STORAGE');
export const unprocessable = (message, details) => new AppError(422, message, 'UNPROCESSABLE', details);
