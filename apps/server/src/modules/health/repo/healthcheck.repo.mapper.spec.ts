import { HealthcheckRepoMapper } from './healthcheck.repo.mapper';
import { HealthcheckEntity } from './entity';
import { Healthcheck } from '../domain';

describe(HealthcheckRepoMapper.name, () => {
	describe(HealthcheckRepoMapper.mapHealthcheckEntityToDO.name, () => {
		describe('when called with all the available fields', () => {
			const setup = () => {
				const testId = 'test_healthcheck_id';
				const testUpdatedAt = new Date();
				const testEntity = new HealthcheckEntity({ id: testId, updatedAt: testUpdatedAt });
				const expectedDO = new Healthcheck(testId, testUpdatedAt);

				return { testEntity, expectedDO };
			};

			it('should map to a valid object', () => {
				const { testEntity, expectedDO } = setup();

				const mappedDO = HealthcheckRepoMapper.mapHealthcheckEntityToDO(testEntity);

				expect(mappedDO).toEqual(expectedDO);
			});
		});
	});
});
