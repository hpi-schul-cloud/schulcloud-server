import { HttpStatus } from '@nestjs/common';
import { UnauthorizedError } from './unauthorized.error';

describe('UnauthorizedError', () => {
	it('should be possible to create', () => {
		const error = new UnauthorizedError('User is not authorized.');
		expect(error).toBeDefined();
		expect(error.message).toBeDefined();
		expect(error.details).toStrictEqual({});
	});

	it('should be possible to add details', () => {
		const details = { callStack: 'The unauthorized error call stack.' };
		const error = new UnauthorizedError('User is not authorized.', details);
		expect(error.getDetails()).toEqual(details);
	});

	it('should have the right code', () => {
		const error = new UnauthorizedError('User is not authorized.');
		expect(error.code).toEqual(HttpStatus.UNAUTHORIZED);
	});

	it('should support interface to populate it for response', () => {
		const error = new UnauthorizedError('User is not authorized.');
		expect(typeof error.getResponse).toEqual('function');
	});
});
