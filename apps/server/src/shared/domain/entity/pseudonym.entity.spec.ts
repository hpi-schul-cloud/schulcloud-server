import { Pseudonym } from '@shared/domain/index';
import { setupEntities } from '@shared/testing';
import { pseudonymFactory } from '@shared/testing/factory/pseudonym.factory';

describe('Pseudonym Entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new Pseudonym();
			expect(test).toThrow();
		});

		it('should create a user by passing required properties', () => {
			const entity = pseudonymFactory.build();
			expect(entity instanceof Pseudonym).toEqual(true);
		});
	});
});
