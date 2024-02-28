import { HealthCheckRepoMapper } from './health-check.repo.mapper';
import { HealthCheckEntity } from './entity';
import { HealthCheck } from '../domain';

describe(HealthCheckRepoMapper.name, () => {
	describe(HealthCheckRepoMapper.mapHealthCheckEntityToDO.name, () => {
		describe('when called with all the available fields', () => {
			const setup = () => {
				const testId = 'test_health_check_id';
				const testUpdatedAt = new Date();
				const testEntity = new HealthCheckEntity({ id: testId, updatedAt: testUpdatedAt });
				const expectedDO = new HealthCheck(testId, testUpdatedAt);

				return { testEntity, expectedDO };
			};

			it('should map to a valid object', () => {
				const { testEntity, expectedDO } = setup();

				const mappedDO = HealthCheckRepoMapper.mapHealthCheckEntityToDO(testEntity);

				expect(mappedDO).toEqual(expectedDO);
			});
		});
	});
});
