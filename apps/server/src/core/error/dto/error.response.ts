import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * HTTP response definition for errors.
 */
export class ErrorResponse {
	/**
	 * Unambigious error identifier, format: UPPERCASE_SNAKE_CASE
	 */
	@ApiProperty({ description: 'The error type.' })
	readonly type: string;

	/**
	 * Description about the type, unique by type, format: Sentence case
	 */
	@ApiProperty({ description: 'The error title.' })
	readonly title: string;

	/**
	 * Additional custom information about the error
	 */
	@ApiProperty({ description: 'The error message.' })
	readonly message: string;

	/**
	 * Must match HTTP error code
	 */
	@ApiProperty({ description: 'The response status code.' })
	readonly code: number;

	/**
	 * Additional custom details about the error
	 */
	@ApiPropertyOptional({ description: 'The error details.' })
	readonly details?: Record<string, unknown>;

	constructor(
		type: string,
		title: string,
		message: string,
		code: number = HttpStatus.CONFLICT,
		details?: Record<string, unknown>
	) {
		this.type = type;
		this.title = title;
		this.message = message;
		this.code = code;
		this.details = details;
	}
}
