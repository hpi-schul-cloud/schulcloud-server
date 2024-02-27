import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';
import { Configuration } from '@hpi-schul-cloud/commons';
import { HealthUC } from './health.uc';
import { HealthService } from '../service';
import { HealthStatuses } from '../domain';
import { HealthConfig } from '../health.config';

describe(HealthUC.name, () => {
	let configBefore: IConfig;
	let module: TestingModule;
	let uc: HealthUC;
	let service: DeepMocked<HealthService>;

	beforeAll(async () => {
		configBefore = Configuration.toObject({ plainSecrets: true });
		module = await Test.createTestingModule({
			providers: [
				HealthUC,
				{
					provide: HealthService,
					useValue: createMock<HealthService>(),
				},
			],
		}).compile();
		uc = module.get(HealthUC);
		service = module.get(HealthService);
	});

	beforeEach(() => {
		Configuration.reset(configBefore);
	});

	afterAll(async () => {
		Configuration.reset(configBefore);
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
					Configuration.set('HEALTH_CHECKS_EXCLUDE_MONGODB', true);
					HealthConfig.reload();

					const healthStatus = await uc.checkOverallHealth();

					expect(healthStatus.status).toEqual(HealthStatuses.STATUS_PASS);
					expect(healthStatus.checks).toBeUndefined();
				});

				it("hasn't been excluded from the checks and health service did not return any error", async () => {
					Configuration.set('HOSTNAME', 'test-hostname');
					Configuration.set('HEALTH_CHECKS_EXCLUDE_MONGODB', false);
					HealthConfig.reload();

					const healthStatus = await uc.checkOverallHealth();

					expect(healthStatus.status).toEqual(HealthStatuses.STATUS_PASS);
					expect(healthStatus.checks).toBeDefined();
				});
			});

			describe(`'${HealthStatuses.STATUS_FAIL}' health status if health service returned an error which`, () => {
				it('contains a message', async () => {
					service.upsertHealthCheckById.mockRejectedValueOnce(new Error('some test error message...'));

					Configuration.set('HOSTNAME', 'test-hostname');
					Configuration.set('HEALTH_CHECKS_EXCLUDE_MONGODB', false);
					HealthConfig.reload();

					const healthStatus = await uc.checkOverallHealth();

					expect(healthStatus.status).toEqual(HealthStatuses.STATUS_FAIL);
					expect(healthStatus.checks).toBeDefined();
				});

				it("doesn't contain a message", async () => {
					service.upsertHealthCheckById.mockRejectedValueOnce('just some plain string...');

					Configuration.set('HOSTNAME', 'test-hostname');
					Configuration.set('HEALTH_CHECKS_EXCLUDE_MONGODB', false);
					HealthConfig.reload();

					const healthStatus = await uc.checkOverallHealth();

					expect(healthStatus.status).toEqual(HealthStatuses.STATUS_FAIL);
					expect(healthStatus.checks).toBeDefined();
				});
			});
		});
	});
});
