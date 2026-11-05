import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';

import { Logger } from '@infra/logger';
import { type StorageClient } from '@infra/valkey-client';
import { HealthStatuses } from '../domain';
import { HEALTH_CONFIG_TOKEN, type HealthConfig } from '../health.config';
import { HEALTH_SESSION_STORAGE_CLIENT } from '../health.constants';
import { HealthService } from '../service';
import { HealthUC } from './health.uc';

describe(HealthUC.name, () => {
	let module: TestingModule;
	let uc: HealthUC;
	let service: DeepMocked<HealthService>;
	let sessionStorage: DeepMocked<StorageClient>;
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
						excludeSessionStorage: true,
					},
				},
				{
					provide: HEALTH_SESSION_STORAGE_CLIENT,
					useValue: createMock<StorageClient>(),
				},
			],
		}).compile();
		uc = module.get(HealthUC);
		service = module.get(HealthService);
		sessionStorage = module.get(HEALTH_SESSION_STORAGE_CLIENT);
		healthConfig = module.get<HealthConfig>(HEALTH_CONFIG_TOKEN);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		healthConfig.hostname = 'localhost';
		healthConfig.excludeMongoDB = false;
		healthConfig.excludeSessionStorage = true;
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
					expect(sessionStorage.set).not.toHaveBeenCalled();
				});

				it("hasn't been excluded from the checks and health service did not return any error", async () => {
					healthConfig.hostname = 'test-hostname';
					healthConfig.excludeMongoDB = false;

					const healthStatus = await uc.checkOverallHealth();

					expect(healthStatus.status).toEqual(HealthStatuses.STATUS_PASS);
					expect(healthStatus.checks).toBeDefined();
				});

				it('uses the default health check ID when hostname is empty', async () => {
					healthConfig.hostname = '';

					const healthStatus = await uc.checkOverallHealth();

					expect(service.upsertHealthCheckById).toHaveBeenCalledWith('db-health-check');
					expect(healthStatus.status).toEqual(HealthStatuses.STATUS_PASS);
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
					expect(healthStatus.checks?.['mongoDB:upsertOperationTime'][0].status).toEqual(HealthStatuses.STATUS_FAIL);
					expect(healthStatus.output).toContain('some test error message...');
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

		describe('session storage', () => {
			beforeEach(() => {
				healthConfig.excludeMongoDB = true;
				healthConfig.excludeSessionStorage = false;
			});

			it('checks storage with a temporary key and reports a pass', async () => {
				const healthStatus = await uc.checkOverallHealth();
				const [key] = sessionStorage.set.mock.calls[0];

				expect(key).toMatch(/^health-check-\d+-[\d.]+$/);
				expect(sessionStorage.set).toHaveBeenCalledWith(key, 'ok', 10);
				expect(sessionStorage.del).toHaveBeenCalledWith(key);
				expect(healthStatus.status).toEqual(HealthStatuses.STATUS_PASS);
				expect(healthStatus.checks?.['sessionStorage:operationTime'][0].status).toEqual(HealthStatuses.STATUS_PASS);
				expect(healthStatus.output).toBeUndefined();
			});

			it('reports a write failure and does not attempt deletion', async () => {
				sessionStorage.set.mockRejectedValueOnce(new Error('Valkey write failed'));

				const healthStatus = await uc.checkOverallHealth();

				expect(healthStatus.status).toEqual(HealthStatuses.STATUS_FAIL);
				expect(healthStatus.checks?.['sessionStorage:operationTime'][0].status).toEqual(HealthStatuses.STATUS_FAIL);
				expect(healthStatus.checks?.['sessionStorage:operationTime'][0].output).toBe('Valkey write failed');
				expect(healthStatus.output).toContain('Valkey write failed');
				expect(sessionStorage.del).not.toHaveBeenCalled();
				expect(module.get(Logger).warning).toHaveBeenCalledTimes(1);
			});

			it('reports a deletion failure after a successful write', async () => {
				sessionStorage.del.mockRejectedValueOnce(new Error('Valkey delete failed'));

				const healthStatus = await uc.checkOverallHealth();

				expect(sessionStorage.set).toHaveBeenCalledTimes(1);
				expect(sessionStorage.del).toHaveBeenCalledTimes(1);
				expect(healthStatus.status).toEqual(HealthStatuses.STATUS_FAIL);
				expect(healthStatus.checks?.['sessionStorage:operationTime'][0].output).toBe('Valkey delete failed');
				expect(healthStatus.output).toContain('Valkey delete failed');
			});

			it('serializes a rejection that has no message property', async () => {
				sessionStorage.set.mockRejectedValueOnce('Valkey unavailable');

				const healthStatus = await uc.checkOverallHealth();

				expect(healthStatus.status).toEqual(HealthStatuses.STATUS_FAIL);
				expect(healthStatus.output).toContain('"Valkey unavailable"');
			});

			it('serializes an object whose message is not a string', async () => {
				sessionStorage.set.mockRejectedValueOnce({ message: 503 });

				const healthStatus = await uc.checkOverallHealth();

				expect(healthStatus.status).toEqual(HealthStatuses.STATUS_FAIL);
				expect(healthStatus.output).toContain('{"message":503}');
			});

			it('treats a rejection without a value as a failure', async () => {
				sessionStorage.set.mockRejectedValueOnce(undefined);

				const healthStatus = await uc.checkOverallHealth();

				expect(healthStatus.status).toEqual(HealthStatuses.STATUS_FAIL);
				expect(healthStatus.checks?.['sessionStorage:operationTime'][0].output).toBe('undefined');
				expect(healthStatus.output).toContain('check error: undefined');
			});

			it('treats an empty error message as a failure', async () => {
				sessionStorage.set.mockRejectedValueOnce(new Error(''));

				const healthStatus = await uc.checkOverallHealth();

				expect(healthStatus.status).toEqual(HealthStatuses.STATUS_FAIL);
				expect(healthStatus.checks?.['sessionStorage:operationTime'][0].output).toBe('');
				expect(healthStatus.output).toContain('check error: ');
			});

			it('falls back to a string for a circular rejection value', async () => {
				const circularError: { self?: unknown } = {};
				circularError.self = circularError;
				sessionStorage.set.mockRejectedValueOnce(circularError);

				const healthStatus = await uc.checkOverallHealth();

				expect(healthStatus.status).toEqual(HealthStatuses.STATUS_FAIL);
				expect(healthStatus.checks?.['sessionStorage:operationTime'][0].output).toBe('[object Object]');
			});

			it('does not check storage when it is excluded', async () => {
				healthConfig.excludeSessionStorage = true;

				const healthStatus = await uc.checkOverallHealth();

				expect(healthStatus.status).toEqual(HealthStatuses.STATUS_PASS);
				expect(healthStatus.checks).toBeUndefined();
				expect(sessionStorage.set).not.toHaveBeenCalled();
				expect(sessionStorage.del).not.toHaveBeenCalled();
			});

			it('reports both dependency failures instead of returning after the first', async () => {
				healthConfig.excludeMongoDB = false;
				service.upsertHealthCheckById.mockRejectedValueOnce(new Error('MongoDB unavailable'));
				sessionStorage.set.mockRejectedValueOnce(new Error('Valkey unavailable'));

				const healthStatus = await uc.checkOverallHealth();

				expect(healthStatus.status).toEqual(HealthStatuses.STATUS_FAIL);
				expect(healthStatus.checks?.['mongoDB:upsertOperationTime'][0].status).toEqual(HealthStatuses.STATUS_FAIL);
				expect(healthStatus.checks?.['sessionStorage:operationTime'][0].status).toEqual(HealthStatuses.STATUS_FAIL);
				expect(healthStatus.output).toContain('MongoDB unavailable');
				expect(healthStatus.output).toContain('Valkey unavailable');
			});

			it('supports a missing optional storage client', async () => {
				const healthStatus = await new HealthUC(service, module.get(Logger), healthConfig).checkOverallHealth();

				expect(healthStatus.status).toEqual(HealthStatuses.STATUS_PASS);
				expect(healthStatus.checks).toBeUndefined();
			});
		});
	});
});
