import { HttpStatus } from '@nestjs/common';
import { InvalidOperationError } from '@shared/common';

describe('InvalidOperationError', () => {
	it('should be possible to create', () => {
		const error = new InvalidOperationError();
		expect(error).toBeDefined();
		expect(error.message).toBeDefined();
		expect(error.details).toStrictEqual({});
	});

	it('should be possible to add details', () => {
		const details = { callStack: 'The invalid operation error call stack.' };
		const error = new InvalidOperationError(undefined, details);
		expect(error.getDetails()).toEqual(details);
	});

	it('should have the right code', () => {
		const error = new InvalidOperationError('entityName');
		expect(error.code).toEqual(HttpStatus.FORBIDDEN);
	});

	it('should support interface to populate it for response', () => {
		const error = new InvalidOperationError();
		expect(typeof error.getResponse).toEqual('function');
	});
});
