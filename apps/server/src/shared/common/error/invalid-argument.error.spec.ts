import { HttpStatus } from '@nestjs/common';
import { InvalidArgumentError } from './invalid-argument.error';

describe('InvalidArgumentError', () => {
	it('should be possible to create', () => {
		const error = new InvalidArgumentError('Argument is not valid.');
		expect(error).toBeDefined();
		expect(error.message).toBeDefined();
		expect(error.details).toStrictEqual({});
	});

	it('should be possible to add details', () => {
		const details = { callStack: 'The invalid argument error call stack.' };
		const error = new InvalidArgumentError('Argument is not valid.', details);
		expect(error.getDetails()).toEqual(details);
	});

	it('should have the right code', () => {
		const error = new InvalidArgumentError('Argument is not valid.');
		expect(error.code).toEqual(HttpStatus.BAD_REQUEST);
	});

	it('should support interface to populate it for response', () => {
		const error = new InvalidArgumentError('Argument is not valid.');
		expect(typeof error.getResponse).toEqual('function');
	});
});
