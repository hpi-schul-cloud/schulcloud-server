import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorResponse } from '@src/core/error/dto/error.response';
import { IErrorType } from '@src/core/error/interface';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Abstract base class for business errors, errors that are handled
 * within of a client or inside of the application.
 */
export abstract class BusinessError extends HttpException {
	@ApiProperty({ description: 'The response status code.' })
	readonly code: number;

	@ApiProperty({ description: 'The error type.' })
	readonly type: string;

	@ApiProperty({ description: 'The error title.' })
	readonly title: string;

	@ApiProperty({ description: 'The error message.' })
	readonly message: string;

	@ApiProperty({ description: 'The error details.' })
	// Is not matched by type validation because HttpException is already declared
	readonly details: Record<string, unknown>;

	constructor(
		{ type, title, defaultMessage }: IErrorType,
		code: HttpStatus = HttpStatus.CONFLICT,
		details?: Record<string, unknown>
	) {
		super({ code, type, title, message: defaultMessage }, code);
		this.code = code;
		this.type = type;
		this.title = title;
		this.message = defaultMessage;
		this.details = details || {};
	}

	getDetails(): Record<string, unknown> {
		return this.details;
	}

	getResponse(): ErrorResponse {
		return new ErrorResponse(this.type, this.title, this.message, this.code);
	}
}
