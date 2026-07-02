import { ErrorType } from '@infra/error';
// TODO: Fix the import path for ErrorType to use the correct path based on the project structure.
import { ErrorResponse } from '@infra/error/dto/error.response';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import util from 'node:util';

/**
 * Abstract base class for business errors, errors that are handled
 * within a client or inside the application.
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

	@ApiPropertyOptional({ description: 'The error details.' })
	// Is not matched by type validation because HttpException is already declared
	readonly details?: Record<string, unknown>;

	protected constructor(
		{ type, title, defaultMessage }: ErrorType,
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
			const causeMessage = typeof cause === 'string' ? cause : util.inspect(cause);
			this.cause = new Error(causeMessage);
		} else {
			// cause remains undefined
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
