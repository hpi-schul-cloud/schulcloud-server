import { HttpException, HttpStatus, ValidationError } from '@nestjs/common';
import { IErrorType } from '../interface/error-type.interface';

/**
 * Abstract base class for business errors, errors that are handled
 * within of a client or inside of the application.
 */
export abstract class BusinessError extends HttpException {
	constructor({ type, title, defaultMessage }: IErrorType, code: HttpStatus = HttpStatus.CONFLICT, responseData?: any) {
		super({ code, type, title, message: defaultMessage, ...responseData }, code);
	}
}

/**
 * sample business error implementation
 */
export class SampleError extends BusinessError {
	constructor(message?: string, responseData?: any) {
		super(
			{
				type: 'SAMPLE_ERROR',
				title: 'Sample Error',
				defaultMessage: message || 'default sample error message',
			},
			HttpStatus.NOT_IMPLEMENTED,
			responseData
		);
	}
}
