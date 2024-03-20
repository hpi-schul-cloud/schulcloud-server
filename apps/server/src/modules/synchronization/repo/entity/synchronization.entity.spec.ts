import { setupEntities } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { SynchronizationEntity } from './synchronization.entity';
import { SynchronizationStatusModel } from '../../domain/types';

describe(SynchronizationEntity.name, () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		describe('When constructor is called', () => {
			const setup = () => {
				const props = {
					id: new ObjectId().toHexString(),
					count: 1,
					failureCause: '',
					status: SynchronizationStatusModel.REGISTERED,
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				return { props };
			};
			it('should throw an error by empty constructor', () => {
				// @ts-expect-error: Test case
				const test = () => new SynchronizationEntity();
				expect(test).toThrow();
			});

			it('should create a synchronizationsEntity by passing required properties', () => {
				const { props } = setup();
				const entity: SynchronizationEntity = new SynchronizationEntity(props);

				expect(entity instanceof SynchronizationEntity).toEqual(true);
			});

			it(`should return a valid object with fields values set from the provided complete props object`, () => {
				const { props } = setup();
				const entity: SynchronizationEntity = new SynchronizationEntity(props);

				const entityProps = {
					id: entity.id,
					count: entity.count,
					failureCause: entity?.failureCause,
					status: entity?.status,
					createdAt: entity.createdAt,
					updatedAt: entity.updatedAt,
				};

				expect(entityProps).toEqual(props);
			});
		});
	});
});
