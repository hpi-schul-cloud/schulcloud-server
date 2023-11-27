import { HttpException, HttpExceptionOptions } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { FeathersError } from '../interface';

export class ErrorUtils {
	static isFeathersError(error: unknown): error is FeathersError {
		let isFeathersError = false;

		if (error instanceof Error && 'type' in error) {
			isFeathersError = (error as FeathersError)?.type === 'FeathersError';
		}

		return isFeathersError;
	}

	static isBusinessError(error: unknown): error is BusinessError {
		return error instanceof BusinessError;
	}

	static isNestHttpException(error: unknown): error is HttpException {
		return error instanceof HttpException;
	}

	static createHttpExceptionOptions(error: unknown, description?: string): HttpExceptionOptions {
		let causeError: Error | undefined;

		if (error instanceof Error) {
			causeError = error;
		} else {
			causeError = error ? new Error(JSON.stringify(error)) : undefined;
		}

		return { cause: causeError, description };
	}
}
