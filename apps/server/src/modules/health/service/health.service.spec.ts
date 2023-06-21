import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

import { ALL_INTERNAL_ENTITIES, HealthcheckDO } from '@shared/domain';
import { HealthcheckRepo } from '@src/modules/health/repo';
import { setupEntities } from '@shared/testing';
import { HealthService } from './health.service';

describe(HealthService.name, () => {
	const testId = 'test_healthcheck_id';
	const testUpdatedAt = new Date();
	const testDO = new HealthcheckDO(testId, testUpdatedAt);

	let module: TestingModule;
	let service: HealthService;
	let repo: DeepMocked<HealthcheckRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				HealthService,
				{
					provide: HealthcheckRepo,
					useValue: createMock<HealthcheckRepo>(),
				},
			],
		}).compile();
		service = module.get(HealthService);
		repo = module.get(HealthcheckRepo);

		await setupEntities(ALL_INTERNAL_ENTITIES);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findHealthcheckById', () => {
		describe('should call', () => {
			it('the proper healthcheck repository method with given ID', async () => {
				await service.findHealthcheckById(testId);

				expect(repo.findById).toHaveBeenCalledWith(testId);
			});
		});

		describe('should return', () => {
			it('the healthcheck domain object with given ID (if found in a repo)', async () => {
				repo.findById.mockResolvedValueOnce(testDO);
				const expectedDO = new HealthcheckDO(testId, testUpdatedAt);

				const foundDO = await service.findHealthcheckById(testId);

				expect(foundDO).toEqual(expectedDO);
			});

			it('the null healthcheck domain object (if not found in a repo)', async () => {
				repo.findById.mockResolvedValueOnce(null);

				const foundDO = await service.findHealthcheckById(testId);

				expect(foundDO).toBeNull();
			});
		});
	});
});
