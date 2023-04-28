import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorResponse } from '@src/core/error/dto/error.response';
import { IErrorType } from '@src/core/error/interface';

/**
 * Abstract base class for business errors, errors that are handled
 * within of a client or inside of the application.
 */
export abstract class BusinessError extends HttpException {
	readonly code: number;

	readonly type: string;

	readonly title: string;

	readonly message: string;

	readonly details?: Record<string, unknown>;

	protected constructor(
		{ type, title, defaultMessage }: IErrorType,
		code: HttpStatus = HttpStatus.CONFLICT,
		details?: Record<string, unknown>,
		cause?: unknown
	) {
		super({ code, type, title, message: defaultMessage }, code);
		this.code = code;
		this.type = type;
		this.title = title;
		this.message = defaultMessage;
		this.details = details;

		if (cause instanceof Error) {
			this.cause = cause;
		} else if (cause !== undefined) {
			this.cause = new Error(String(cause));
		}
	}

	override getResponse(): ErrorResponse {
		const errorResponse: ErrorResponse = new ErrorResponse(
			this.type,
			this.title,
			this.message,
			this.code,
			this.details
		);

		return errorResponse;
	}
}
