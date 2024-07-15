export interface ErrorResponseDto {
	details?: {
		[key: string]: {};
	};
	error: string;
	logLevel?: string;
	message: string;
	stacktrace?: string;
	stacktraceArray: Array<string>;
}
