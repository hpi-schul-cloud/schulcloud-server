import { FeathersError } from '@feathersjs/errors';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorUtils } from './error.utils';

class SampleBusinessError extends BusinessError {
	constructor() {
		super(
			{
				type: 'SAMPLE_ERROR',
				title: 'Sample Error',
				defaultMessage: 'sample error message',
			},
			HttpStatus.NOT_IMPLEMENTED
		);
	}
}

describe('ErrorUtils', () => {
	describe('isFeathersError', () => {
		it('should return true if error is FeathersError', () => {
			const error = new FeathersError('test message', 'test name', HttpStatus.BAD_REQUEST, 'test class name', {});

			const result = ErrorUtils.isFeathersError(error);

			expect(result).toBe(true);
		});

		it('should return true if error is not FeathersError', () => {
			const error = new Error();

			const result = ErrorUtils.isFeathersError(error);

			expect(result).toBe(false);
		});
	});

	describe('isBusinessError', () => {
		it('should return true if error is BusinessError', () => {
			const error = new SampleBusinessError();

			const result = ErrorUtils.isBusinessError(error);

			expect(result).toBe(true);
		});

		it('should return true if error is not BusinessError', () => {
			const error = new Error();

			const result = ErrorUtils.isBusinessError(error);

			expect(result).toBe(false);
		});
	});

	describe('isNestHttpException', () => {
		it('should return true if error is NestHttpException', () => {
			const error = new BadRequestException();

			const result = ErrorUtils.isNestHttpException(error);

			expect(result).toBe(true);
		});

		it('should return true if error is not NestHttpException', () => {
			const error = new Error();

			const result = ErrorUtils.isNestHttpException(error);

			expect(result).toBe(false);
		});
	});

	describe('convertUnknownError', () => {
		it('should return HttpExceptionOptions if error is instance of Error', () => {
			const error = new BadRequestException();

			const result = ErrorUtils.convertUnknownError(error);

			const expectedResult = { cause: error };

			expect(result).toEqual(expectedResult);
		});

		it('should return HttpExceptionOptions if error is a string', () => {
			const error = 'test string';

			const result = ErrorUtils.convertUnknownError(error);

			const expectedResult = { cause: new Error(JSON.stringify(error)) };

			expect(result).toEqual(expectedResult);
		});

		it('should return HttpExceptionOptions if error is a number', () => {
			const error = 1;

			const result = ErrorUtils.convertUnknownError(error);

			const expectedResult = { cause: new Error(JSON.stringify(error)) };

			expect(result).toEqual(expectedResult);
		});

		it('should return HttpExceptionOptions if error is a object', () => {
			const error = { a: 1 };

			const result = ErrorUtils.convertUnknownError(error);

			const expectedResult = { cause: new Error(JSON.stringify(error)) };

			expect(result).toEqual(expectedResult);
		});
	});
});
