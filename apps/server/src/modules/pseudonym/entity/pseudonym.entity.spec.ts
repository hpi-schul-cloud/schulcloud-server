import { setupEntities } from '@shared/testing';
import { pseudonymEntityFactory } from '@shared/testing/factory/pseudonym.factory';
import { PseudonymEntity } from './pseudonym.entity';

describe('Pseudonym Entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new PseudonymEntity();
			expect(test).toThrow();
		});

		it('should create a user by passing required properties', () => {
			const entity: PseudonymEntity = pseudonymEntityFactory.build();

			expect(entity instanceof PseudonymEntity).toEqual(true);
		});
	});
});
