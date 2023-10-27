import { DeletionRequest } from '../../domain/deletion-request.do';
import { deletionRequestFactory } from '../../domain/testing/factory/deletion-request.factory';
import { DeletionRequestEntity } from '../../entity';
import { deletionRequestEntityFactory } from '../../entity/testing/factory/deletion-request.entity.factory';
import { DeletionRequestMapper } from './deletion-request.mapper';

describe(DeletionRequestMapper.name, () => {
	describe('mapToDO', () => {
		describe('When entity is mapped for domainObject', () => {
			it('should properly map the entity to the domain object', () => {
				const entity = deletionRequestEntityFactory.build();

				const domainObject = DeletionRequestMapper.mapToDO(entity);

				const expectedDomainObject = new DeletionRequest({
					id: entity.id,
					domain: entity.domain,
					deleteAfter: entity.deleteAfter,
					itemId: entity.itemId,
					status: entity.status,
					createdAt: entity.createdAt,
					updatedAt: entity.updatedAt,
				});

				expect(domainObject).toEqual(expectedDomainObject);
			});
		});
	});

	describe('mapToEntity', () => {
		describe('When domainObject is mapped for entity', () => {
			beforeAll(() => {
				jest.useFakeTimers();
				jest.setSystemTime(new Date());
			});

			afterAll(() => {
				jest.useRealTimers();
			});

			it('should properly map the domainObject to the entity', () => {
				const domainObject = deletionRequestFactory.build();

				const entity = DeletionRequestMapper.mapToEntity(domainObject);

				const expectedEntity = new DeletionRequestEntity({
					id: domainObject.id,
					domain: domainObject.domain,
					deleteAfter: domainObject.deleteAfter,
					itemId: domainObject.itemId,
					status: domainObject.status,
					createdAt: domainObject.createdAt,
					updatedAt: domainObject.updatedAt,
				});

				expect(entity).toEqual(expectedEntity);
			});
		});
	});
});
