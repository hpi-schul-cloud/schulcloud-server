import { deletionBatchFactory } from '../../domain/testing';
import { deletionBatchEntityFactory } from '../entity/testing';
import { DeletionBatchDomainMapper } from './deletion-batch-domain.mapper';

describe(DeletionBatchDomainMapper.name, () => {
	describe('mapEntityToDo', () => {
		describe('when entity has domainObject reference', () => {
			const setup = () => {
				const entity = deletionBatchEntityFactory.build();
				const domainObject = deletionBatchFactory.build();
				entity.domainObject = domainObject;

				return { entity, domainObject };
			};

			it('should return domainObject', () => {
				const { entity, domainObject } = setup();

				const result = DeletionBatchDomainMapper.mapEntityToDo(entity);

				expect(result).toBe(domainObject);
			});
		});
	});
});
