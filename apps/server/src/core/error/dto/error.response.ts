import { HttpStatus } from '@nestjs/common';

/**
 * HTTP response definition for errors.
 */
export class ErrorResponse {
	/**
	 * Unambiguous error identifier, format: UPPERCASE_SNAKE_CASE
	 */
	readonly type: string;

	/**
	 * Description about the type, unique by type, format: Sentence case
	 */
	readonly title: string;

	/**
	 * Additional custom information about the error
	 */
	readonly message: string;

	/**
	 * Must match HTTP error code
	 */
	readonly code: number;

	/**
	 * Additional custom details about the error
	 */
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
