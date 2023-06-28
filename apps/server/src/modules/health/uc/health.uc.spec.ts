import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

import { HealthUc } from './health.uc';
import { HealthService } from '../service';
import { HealthStatuses, HealthStatus } from '../domain';

describe(HealthUc.name, () => {
	let module: TestingModule;
	let uc: HealthUc;
	let service: DeepMocked<HealthService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				HealthUc,
				{
					provide: HealthService,
					useValue: createMock<HealthService>(),
				},
			],
		}).compile();
		uc = module.get(HealthUc);
		service = module.get(HealthService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('checkSelfHealth', () => {
		it(`should return health status with '${HealthStatuses.STATUS_PASS}' status`, async () => {
			const healthStatus = uc.checkSelfHealth();

			expect(healthStatus.status).toEqual(HealthStatuses.STATUS_PASS);
		});
	});
});
