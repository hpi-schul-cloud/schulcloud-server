import { HttpStatus } from '@nestjs/common';
import { AuthorizationError } from '@shared/common';

describe('AuthorizationError', () => {
	it('should be possible to create', () => {
		const error = new AuthorizationError();
		expect(error).toBeDefined();
		expect(error.message).toBeDefined();
		expect(error.details).toBeUndefined();
	});

	it('should be possible to add details', () => {
		const details = { callStack: 'The authorization error call stack.' };
		const error = new AuthorizationError(undefined, details);
		expect(error.details).toEqual(details);
	});

	it('should have the right code', () => {
		const error = new AuthorizationError('reason');
		expect(error.code).toEqual(HttpStatus.UNAUTHORIZED);
	});

	it('should support interface to populate it for response', () => {
		const error = new AuthorizationError();
		expect(typeof error.getResponse).toEqual('function');
	});
});
