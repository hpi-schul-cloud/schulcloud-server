import { HttpStatus } from '@nestjs/common';
import { EntityNotFoundError } from './entity-not-found.error';

describe('Entity Not Found Error', () => {
	it('should be possible to create', () => {
		const error = new EntityNotFoundError('entityName');
		expect(error).toBeDefined();
	});

	it('should be possible to add details', () => {
		const details = { entityId: 1234 };
		const error = new EntityNotFoundError('entityName', details);
		expect(error.details).toEqual(details);
	});

	it('should have the right code', () => {
		const error = new EntityNotFoundError('entityName');
		expect(error.code).toEqual(HttpStatus.NOT_FOUND);
	});

	it('should support interface to populate it for response', () => {
		const error = new EntityNotFoundError('entityName');
		expect(typeof error.getResponse).toEqual('function');
	});
});
