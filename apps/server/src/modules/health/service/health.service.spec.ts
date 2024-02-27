import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

import { setupEntities } from '@shared/testing';
import { HealthService } from './health.service';
import { HealthCheckRepo } from '../repo';
import { HealthCheck } from '../domain';
import { HealthCheckEntity } from '../repo/entity';

describe(HealthService.name, () => {
	const testId = 'test_health_check_id';
	const testUpdatedAt = new Date();
	const testDO = new HealthCheck(testId, testUpdatedAt);

	let module: TestingModule;
	let service: HealthService;
	let repo: DeepMocked<HealthCheckRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				HealthService,
				{
					provide: HealthCheckRepo,
					useValue: createMock<HealthCheckRepo>(),
				},
			],
		}).compile();
		service = module.get(HealthService);
		repo = module.get(HealthCheckRepo);

		await setupEntities([HealthCheckEntity]);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('upsertHealthCheckById', () => {
		describe('should call', () => {
			it('the proper health check repository method with given ID', async () => {
				await service.upsertHealthCheckById(testId);

				expect(repo.upsertById).toHaveBeenCalledWith(testId);
			});
		});

		describe('should return', () => {
			const setup = () => {
				repo.upsertById.mockResolvedValueOnce(testDO);
				const expectedDO = new HealthCheck(testId, testUpdatedAt);

				return { expectedDO };
			};

			it('the upserted health check domain object with given ID', async () => {
				const { expectedDO } = setup();

				const foundDO = await service.upsertHealthCheckById(testId);

				expect(foundDO).toEqual(expectedDO);
			});
		});
	});
});
