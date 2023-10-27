import { setupEntities } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { DeletionRequestEntity } from '@src/modules/deletion/entity/deletion-request.entity';
import { DeletionDomainModel } from '../domain/types/deletion-domain-model.enum';
import { DeletionStatusModel } from '../domain/types/deletion-status-model.enum';

describe(DeletionRequestEntity.name, () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		describe('When constructor is called', () => {
			const setup = () => {
				const props = {
					id: new ObjectId().toHexString(),
					domain: DeletionDomainModel.USER,
					deleteAfter: new Date(),
					itemId: new ObjectId().toHexString(),
					status: DeletionStatusModel.REGISTERED,
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				return { props };
			};

			it('should throw an error by empty constructor', () => {
				// @ts-expect-error: Test case
				const test = () => new DeletionRequestEntity();
				expect(test).toThrow();
			});

			it('should create a deletionRequest by passing required properties', () => {
				const { props } = setup();
				const entity: DeletionRequestEntity = new DeletionRequestEntity(props);

				expect(entity instanceof DeletionRequestEntity).toEqual(true);
			});

			it(`should return a valid object with fields values set from the provided complete props object`, () => {
				const { props } = setup();
				const entity: DeletionRequestEntity = new DeletionRequestEntity(props);

				const entityProps = {
					id: entity.id,
					domain: entity.domain,
					deleteAfter: entity.deleteAfter,
					itemId: entity.itemId,
					status: entity.status,
					createdAt: entity.createdAt,
					updatedAt: entity.updatedAt,
				};

				expect(entityProps).toEqual(props);
			});
		});
	});
});
