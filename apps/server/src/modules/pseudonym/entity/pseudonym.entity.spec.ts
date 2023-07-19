import { Pseudonym } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import { pseudonymEntityFactory } from '@shared/testing/factory/pseudonym.factory';

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
			const entity = pseudonymEntityFactory.build();
			expect(entity instanceof Pseudonym).toEqual(true);
		});
	});
});
