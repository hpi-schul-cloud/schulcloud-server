import { HttpException } from '@nestjs/common';

/**
 * Abstract base class for business errors, that are mostly handled
 * within of a client or inside ofthe application.
 */
export abstract class BusinessError extends HttpException {}
