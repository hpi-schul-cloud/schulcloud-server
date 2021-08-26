import { HttpStatus } from '@nestjs/common';

import { ValidationError } from './validation.error';

describe('Validation Error', () => {
	it('should possible to create', () => {
		const error = new ValidationError('message');
		expect(error).toBeDefined();
	});

	it('should possible to add details', () => {
		const details = { userId: 123 };
		const error = new ValidationError('message', details);
		expect(error.getDetails()).toEqual(details);
	});

	it('should have the right code', () => {
		const error = new ValidationError('message');
		expect(error.code).toEqual(HttpStatus.BAD_REQUEST);
	});

	it('should support interface to populate it for response', () => {
		const error = new ValidationError('message');
		expect(typeof error.getResponse).toEqual('function');
	});
});
