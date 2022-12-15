import { HttpException } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { FeathersError } from '../interface';

export class ErrorUtils {
	static isFeathersError(error: Error): error is FeathersError {
		let isFeathersError = false;

		if (error && 'type' in error) {
			isFeathersError = (error as FeathersError)?.type === 'FeathersError';
		}

		return isFeathersError;
	}

	static isBusinessError(error: Error): error is BusinessError {
		return error instanceof BusinessError;
	}

	static isNestHttpException(error: Error): error is HttpException {
		return error instanceof HttpException;
	}
}
