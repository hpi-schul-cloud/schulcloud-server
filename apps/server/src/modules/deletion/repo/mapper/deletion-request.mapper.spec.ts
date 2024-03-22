import { DeletionRequest } from '../../domain/do';
import { deletionRequestFactory } from '../../domain/testing';
import { DeletionRequestEntity } from '../entity';
import { deletionRequestEntityFactory } from '../entity/testing';
import { DeletionRequestMapper } from './deletion-request.mapper';

describe(DeletionRequestMapper.name, () => {
	describe('mapToDO', () => {
		describe('When entity is mapped for domainObject', () => {
			const setup = () => {
				const entity = deletionRequestEntityFactory.build();

				const expectedDomainObject = new DeletionRequest({
					id: entity.id,
					targetRefDomain: entity.targetRefDomain,
					deleteAfter: entity.deleteAfter,
					targetRefId: entity.targetRefId,
					status: entity.status,
					createdAt: entity.createdAt,
					updatedAt: entity.updatedAt,
				});

				return { entity, expectedDomainObject };
			};

			it('should properly map the entity to the domain object', () => {
				const { entity, expectedDomainObject } = setup();

				const domainObject = DeletionRequestMapper.mapToDO(entity);

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
			const setup = () => {
				const domainObject = deletionRequestFactory.build();

				const expectedEntity = new DeletionRequestEntity({
					id: domainObject.id,
					targetRefDomain: domainObject.targetRefDomain,
					deleteAfter: domainObject.deleteAfter,
					targetRefId: domainObject.targetRefId,
					status: domainObject.status,
					createdAt: domainObject.createdAt,
					updatedAt: domainObject.updatedAt,
				});

				return { domainObject, expectedEntity };
			};

			it('should properly map the domainObject to the entity', () => {
				const { domainObject, expectedEntity } = setup();

				const entity = DeletionRequestMapper.mapToEntity(domainObject);

				expect(entity).toEqual(expectedEntity);
			});
		});
	});
});
