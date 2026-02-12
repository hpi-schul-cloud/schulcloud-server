import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { Logger } from '@core/logger';
import { HealthStatuses } from '../domain';
import { HEALTH_CONFIG_TOKEN, HealthConfig } from '../health.config';
import { HealthService } from '../service';
import { HealthUC } from './health.uc';

describe(HealthUC.name, () => {
	let module: TestingModule;
	let uc: HealthUC;
	let service: DeepMocked<HealthService>;
	let healthConfig: HealthConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				HealthUC,
				{
					provide: HealthService,
					useValue: createMock<HealthService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: HEALTH_CONFIG_TOKEN,
					useValue: {
						hostname: 'localhost',
						excludeMongoDB: false,
					},
				},
			],
		}).compile();
		uc = module.get(HealthUC);
		service = module.get(HealthService);
		healthConfig = module.get<HealthConfig>(HEALTH_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('checkSelfHealth', () => {
		it(`should return '${HealthStatuses.STATUS_PASS}' health status`, () => {
			const healthStatus = uc.checkSelfHealth();

			expect(healthStatus.status).toEqual(HealthStatuses.STATUS_PASS);
		});
	});

	describe('checkOverallHealth', () => {
		describe('should return', () => {
			describe(`'${HealthStatuses.STATUS_PASS}' health status if MongoDB`, () => {
				it('has been excluded from the checks', async () => {
					healthConfig.excludeMongoDB = true;

					const healthStatus = await uc.checkOverallHealth();

					expect(healthStatus.status).toEqual(HealthStatuses.STATUS_PASS);
					expect(healthStatus.checks).toBeUndefined();
				});

				it("hasn't been excluded from the checks and health service did not return any error", async () => {
					healthConfig.hostname = 'test-hostname';
					healthConfig.excludeMongoDB = false;

					const healthStatus = await uc.checkOverallHealth();

					expect(healthStatus.status).toEqual(HealthStatuses.STATUS_PASS);
					expect(healthStatus.checks).toBeDefined();
				});
			});

			describe(`'${HealthStatuses.STATUS_FAIL}' health status if health service returned an error which`, () => {
				it('contains a message', async () => {
					service.upsertHealthCheckById.mockRejectedValueOnce(new Error('some test error message...'));

					healthConfig.hostname = 'test-hostname';
					healthConfig.excludeMongoDB = false;

					const healthStatus = await uc.checkOverallHealth();

					expect(healthStatus.status).toEqual(HealthStatuses.STATUS_FAIL);
					expect(healthStatus.checks).toBeDefined();
				});

				it("doesn't contain a message", async () => {
					service.upsertHealthCheckById.mockRejectedValueOnce('just some plain string...');

					healthConfig.hostname = 'test-hostname';
					healthConfig.excludeMongoDB = false;

					const healthStatus = await uc.checkOverallHealth();

					expect(healthStatus.status).toEqual(HealthStatuses.STATUS_FAIL);
					expect(healthStatus.checks).toBeDefined();
				});
			});
		});
	});
});
