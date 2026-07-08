import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import util from 'node:util';
import { ErrorType, InternalErrorResponse } from './interfaces';

/**
 * Abstract base class for business errors, errors that are handled
 * within a client or inside the application.
 */
export abstract class BusinessError extends HttpException {
	@ApiProperty({ description: 'The response status code.' })
	public readonly code: number;

	@ApiProperty({ description: 'The error type.' })
	public readonly type: string;

	@ApiProperty({ description: 'The error title.' })
	public readonly title: string;

	@ApiProperty({ description: 'The error message.' })
	public readonly message: string;

	@ApiPropertyOptional({ description: 'The error details.' })
	// Is not matched by type validation because HttpException is already declared
	public readonly details?: Record<string, unknown>;

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

	public override getResponse(): InternalErrorResponse {
		const errorResponse: InternalErrorResponse = {
			type: this.type,
			title: this.title,
			message: this.message,
			code: this.code,
			details: this.details,
		};

		return errorResponse;
	}
}
