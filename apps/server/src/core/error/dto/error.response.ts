/**
 * HTTP response definition for errors.
 */
export class ErrorResponse {
	/**
	 * Must match HTTP error code
	 */
	readonly code: number;
	/**
	 * Unambigious error identifier, format: UPPERCASE_SNAKE_CASE
	 */
	readonly type: string;
	/**
	 * Description about the type, unique by type, format: Sentence case
	 */
	readonly title: string;
	/**
	 * additional custom information about the error
	 */
	readonly message: string;
}
