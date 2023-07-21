import { setupEntities } from '@shared/testing';
import { pseudonymEntityFactory } from '@shared/testing/factory/pseudonym.factory';
import { ObjectId } from '@mikro-orm/mongodb';
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

		describe('when passed undefined id', () => {
			const setup = () => {
				const entity: PseudonymEntity = pseudonymEntityFactory.build();

				return { entity };
			};

			it('should not set the id', () => {
				const { entity } = setup();

				const pseudonymEntity = new PseudonymEntity(entity);

				expect(pseudonymEntity.id).toBeNull();
			});
		});

		describe('when passed a valid id', () => {
			const setup = () => {
				const entity: PseudonymEntity = pseudonymEntityFactory.build({ id: new ObjectId().toHexString() });

				return { entity };
			};

			it('should set the id', () => {
				const { entity } = setup();

				const pseudonymEntity: PseudonymEntity = new PseudonymEntity(entity);

				expect(pseudonymEntity.id).toEqual(entity.id);
			});
		});
	});
});
