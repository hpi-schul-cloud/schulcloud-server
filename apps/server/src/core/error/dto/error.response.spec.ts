import { HttpStatus } from '@nestjs/common';
import { ErrorResponse } from './error.response';

describe('ErrorResponse', () => {
	describe('when creating a error response', () => {
		it('should have basic properties defined', () => {
			const errorResponse = new ErrorResponse('TYPE', 'Title', 'message', 42);
			expect(errorResponse.type).toEqual('TYPE');
			expect(errorResponse.title).toEqual('Title');
			expect(errorResponse.message).toEqual('message');
			expect(errorResponse.code).toEqual(42);
		});
		it('should have basic properties defined with default code', () => {
			const errorResponse = new ErrorResponse('TYPE', 'Title', 'message');
			expect(errorResponse.type).toEqual('TYPE');
			expect(errorResponse.title).toEqual('Title');
			expect(errorResponse.message).toEqual('message');
			expect(errorResponse.code).toEqual(409);
			expect(errorResponse.code).toEqual(HttpStatus.CONFLICT);
		});
	});
});
