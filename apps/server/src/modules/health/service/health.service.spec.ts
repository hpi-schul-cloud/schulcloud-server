import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

import { setupEntities } from '@shared/testing';
import { HealthService } from './health.service';
import { HealthcheckRepo } from '../repo';
import { Healthcheck } from '../domain';
import { HealthcheckEntity } from '../repo/entity';

describe(HealthService.name, () => {
	const testId = 'test_healthcheck_id';
	const testUpdatedAt = new Date();
	const testDO = new Healthcheck(testId, testUpdatedAt);

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

		await setupEntities([HealthcheckEntity]);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findHealthcheckById', () => {
		describe('should call', () => {
			it('the proper healthcheck repository method with given ID', async () => {
				await service.upsertHealthcheckById(testId);

				expect(repo.upsertById).toHaveBeenCalledWith(testId);
			});
		});

		describe('should return', () => {
			it('the upserted healthcheck domain object with given ID', async () => {
				repo.upsertById.mockResolvedValueOnce(testDO);
				const expectedDO = new Healthcheck(testId, testUpdatedAt);

				const foundDO = await service.upsertHealthcheckById(testId);

				expect(foundDO).toEqual(expectedDO);
			});
		});
	});
});
