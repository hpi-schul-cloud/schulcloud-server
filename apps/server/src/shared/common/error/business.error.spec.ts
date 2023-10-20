import { HttpStatus } from '@nestjs/common';
import { BusinessError } from './business.error';

describe('BusinessError', () => {
	describe('When a sample error from business error is created', () => {
		class SampleError extends BusinessError {
			constructor(message?: string) {
				super(
					{
						type: 'SAMPLE_ERROR',
						title: 'Sample Error',
						defaultMessage: message || 'default sample error message',
					},
					HttpStatus.NOT_IMPLEMENTED
				);
			}
		}
		it('should have code, type, title, and message to be defined', () => {
			const error = new SampleError();
			expect(error.code).toEqual(501);
			expect(error.code).toEqual(HttpStatus.NOT_IMPLEMENTED);
			expect(error.title).toEqual('Sample Error');
			expect(error.type).toEqual('SAMPLE_ERROR');
			expect(error.message).toEqual('default sample error message');
		});

		it('should set custom message', () => {
			const error = new SampleError('with a custom message');
			expect(error.message).toEqual('with a custom message');
		});
	});
	describe('when a business error is extended', () => {
		class BusinessErrorImpl extends BusinessError {
			constructor(message?: string, code?: number, details?: Record<string, unknown>, cause?: unknown) {
				super(
					{
						type: 'SAMPLE_ERROR',
						title: 'Sample Error',
						defaultMessage: message || 'default sample error message',
					},
					code,
					details,
					cause
				);
			}
		}
		it('should have a default error code', () => {
			const error = new BusinessErrorImpl();
			const status = error.getStatus();
			expect(status).toEqual(HttpStatus.CONFLICT);
			expect(status).toEqual(409);
		});

		it('should override the default message and error code', () => {
			const error = new BusinessErrorImpl('custom message', 123);
			const status = error.getStatus();
			expect(status).toEqual(123);
			expect(error.message).toEqual('custom message');
		});

		it('should set details per default to empty object', () => {
			const error = new BusinessErrorImpl('custom message', 123);
			const result = error.details;
			expect(result).toBeUndefined();
		});

		it('should set details over parameter in constuctor', () => {
			const details = { userId: 123 };
			const error = new BusinessErrorImpl('custom message', 123, details);
			const result = error.details;
			expect(result).toEqual(details);
		});

		it('should set the cause from an error', () => {
			const cause = new Error('Cause');
			const error = new BusinessErrorImpl('custom message', 123, undefined, cause);
			const result = error.cause;
			expect(result).toEqual(cause);
		});

		it('should set the cause from a string', () => {
			const cause = 'Cause';
			const error = new BusinessErrorImpl('custom message', 123, undefined, cause);
			const result = error.cause;
			expect(result).toEqual(new Error(cause));
		});

		it('should set the cause from an object', () => {
			const cause = { error: 'Cause' };
			const error = new BusinessErrorImpl('custom message', 123, undefined, cause);
			const result = error.cause;
			console.log(new Error(String(cause)));
			expect(result).toEqual(new Error(JSON.stringify(cause)));
		});
	});
});
