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
			constructor(message?: string, code?: number) {
				super(
					{
						type: 'SAMPLE_ERROR',
						title: 'Sample Error',
						defaultMessage: message || 'default sample error message',
					},
					code
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
	});
});
