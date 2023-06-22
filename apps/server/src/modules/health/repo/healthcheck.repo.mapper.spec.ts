import { HealthcheckRepoMapper } from './healthcheck.repo.mapper';
import { HealthcheckEntity } from './entity';
import { Healthcheck } from '../domain';

describe(HealthcheckRepoMapper.name, () => {
	const testId = 'test_healthcheck_id';
	const testUpdatedAt = new Date();
	const testEntity = new HealthcheckEntity({ id: testId, updatedAt: testUpdatedAt });

	describe(HealthcheckRepoMapper.mapHealthcheckEntityToDo.name, () => {
		describe('should map', () => {
			it('null entity to null domain object', () => {
				const mappedDo = HealthcheckRepoMapper.mapHealthcheckEntityToDo(null);

				expect(mappedDo).toBeNull();
			});

			it('entity with all the fields filled to proper domain object', () => {
				const expectedDomainObject = new Healthcheck(testId, testUpdatedAt);

				const mappedDo = HealthcheckRepoMapper.mapHealthcheckEntityToDo(testEntity);

				expect(mappedDo).toEqual(expectedDomainObject);
			});
		});
	});
});
