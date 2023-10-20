import { setupEntities } from '@shared/testing';
import { DeletionRequestEntity } from '../deletion-request.entity';
import { deletionRequestEntityFactory } from './factory/deletion-request.entity.factory';

describe(DeletionRequestEntity.name, () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		describe('When constructor is called', () => {
			it('should create a deletionRequest by passing required properties', () => {
				const entity: DeletionRequestEntity = deletionRequestEntityFactory.build();

				expect(entity instanceof DeletionRequestEntity).toEqual(true);
			});
		});
	});
});
