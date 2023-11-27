import { HttpStatus } from '@nestjs/common';
import { ForbiddenOperationError } from '@shared/common';

describe('ForbiddenOperationError', () => {
	it('should be possible to create', () => {
		const error = new ForbiddenOperationError();
		expect(error).toBeDefined();
		expect(error.message).toBeDefined();
		expect(error.details).toBeUndefined();
	});

	it('should be possible to add details', () => {
		const details = { callStack: 'The forbidden operation error call stack.' };
		const error = new ForbiddenOperationError(undefined, details);
		expect(error.details).toEqual(details);
	});

	it('should have the right code', () => {
		const error = new ForbiddenOperationError('reason');
		expect(error.code).toEqual(HttpStatus.FORBIDDEN);
	});

	it('should support interface to populate it for response', () => {
		const error = new ForbiddenOperationError();
		expect(typeof error.getResponse).toEqual('function');
	});
});
