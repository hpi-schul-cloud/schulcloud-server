import { HttpException, HttpStatus } from '@nestjs/common';
import { IErrorType } from '../../core/error/interface';
import { ErrorResponse } from '../../core/error/dto/error.response';

/**
 * Abstract base class for business errors, errors that are handled
 * within of a client or inside of the application.
 */
export abstract class BusinessError extends HttpException {
	readonly code: number;

	readonly type: string;

	readonly title: string;

	readonly message: string;

	constructor({ type, title, defaultMessage }: IErrorType, code: HttpStatus = HttpStatus.CONFLICT) {
		super({ code, type, title, message: defaultMessage }, code);
		this.code = code;
		this.type = type;
		this.title = title;
		this.message = defaultMessage;
	}

	getResponse(): ErrorResponse {
		return new ErrorResponse(this.type, this.title, this.message, this.code);
	}
}
