import { DomainErrorHandler } from '@core/error';
import { Logger } from '@core/logger';
import { createMock } from '@golevelup/ts-jest';
import Valkey from 'iovalkey';
import * as util from 'util';
import { InMemoryClient, ValkeyClient } from './clients';
import { ValkeyFactory } from './valkey.factory';
import { ValkeyMode } from './valkey.config';
import { ConnectedLoggable } from './loggable';

jest.mock('iovalkey');
jest.mock('util');

const domainErrorHandler = createMock<DomainErrorHandler>();
const logger = createMock<Logger>();

describe(ValkeyFactory.name, () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('createRedisInstance', () => {
		describe('when config mode is in memory', () => {
			const setup = () => {
				const config = {
					MODE: ValkeyMode.IN_MEMORY,
				};

				return { config };
			};

			it('returns an InMemoryClient instance', async () => {
				const { config } = setup();

				const redisInstance = await ValkeyFactory.build(config, logger, domainErrorHandler);

				expect(redisInstance).toBeInstanceOf(InMemoryClient);
			});

			it('should log ConnectedLoggable if connect event is emitted', async () => {
				const { config } = setup();

				const redisInstance = await ValkeyFactory.build(config, logger, domainErrorHandler);

				redisInstance.emit('connect', { test: true });

				expect(logger.info).toHaveBeenNthCalledWith(1, new ConnectedLoggable({ test: true }));
			});
		});

		describe('when config mode is cluster', () => {
			const setup = () => {
				const sentinelServiceName = 'serviceName';
				const sentinelName = 'sentinelName';
				const sentinelPassword = 'sentinelPassword';

				const config = {
					MODE: ValkeyMode.CLUSTER,
					SENTINEL_SERVICE_NAME: sentinelServiceName,
					SENTINEL_NAME: sentinelName,
					SENTINEL_PASSWORD: sentinelPassword,
				};

				const name1 = 'name1';
				const name2 = 'name2';
				const port1 = 11;
				const port2 = 22;

				const records = [
					{ name: name1, port: port1 },
					{ name: name2, port: port2 },
				];
				const resolveSrv = jest.fn().mockResolvedValueOnce(records);
				jest.spyOn(util, 'promisify').mockImplementation(() => resolveSrv);

				// @ts-expect-error Test only
				const constructorSpy = jest.spyOn(Valkey.prototype, 'constructor');

				const expectedProps = {
					sentinels: [
						{ host: name1, port: port1 },
						{ host: name2, port: port2 },
					],
					sentinelPassword: 'sentinelPassword',
					password: 'sentinelPassword',
					name: 'sentinelName',
				};

				return { resolveSrv, sentinelServiceName, config, logger, constructorSpy, expectedProps };
			};

			it('calls resolveSrv', async () => {
				const { resolveSrv, sentinelServiceName, config, logger } = setup();

				await ValkeyFactory.build(config, logger, domainErrorHandler);

				expect(resolveSrv).toHaveBeenLastCalledWith(sentinelServiceName);
			});

			it('create new Valkey instance with correctly props', async () => {
				const { constructorSpy, expectedProps, config } = setup();

				await ValkeyFactory.build(config, logger, domainErrorHandler);

				expect(constructorSpy).toHaveBeenCalledWith(expectedProps);
			});

			it('creates a new Redis instance', async () => {
				const { config } = setup();

				const redisInstance = await ValkeyFactory.build(config, logger, domainErrorHandler);

				expect(redisInstance).toBeInstanceOf(ValkeyClient);
			});

			describe('when throws an error', () => {
				it('Valkey instance throws an error.', async () => {
					const { config } = setup();
					// @ts-expect-error Test only
					const constructorSpy = jest.spyOn(Valkey.prototype, 'constructor');
					constructorSpy.mockImplementation(() => {
						throw new Error('Connection error');
					});

					await expect(ValkeyFactory.build(config, logger, domainErrorHandler)).rejects.toThrow(
						'Can not create valkey "sentinal" instance.'
					);
				});

				it('SENTINEL_NAME is missing', async () => {
					const { config } = setup();
					// @ts-expect-error Test only
					config.SENTINEL_NAME = undefined;

					await expect(ValkeyFactory.build(config, logger, domainErrorHandler)).rejects.toThrow(
						'SENTINEL_NAME is required for creating a Valkey Sentinel instance'
					);
				});

				it('SENTINEL_PASSWORD is missing', async () => {
					const { config } = setup();
					// @ts-expect-error Test only
					config.SENTINEL_PASSWORD = undefined;

					await expect(ValkeyFactory.build(config, logger, domainErrorHandler)).rejects.toThrow(
						'SENTINEL_PASSWORD is required for creating a Valkey Sentinel instance'
					);
				});

				it('SENTINEL_SERVICE_NAME is missing', async () => {
					const { config } = setup();
					// @ts-expect-error Test only
					config.SENTINEL_SERVICE_NAME = undefined;

					await expect(ValkeyFactory.build(config, logger, domainErrorHandler)).rejects.toThrow(
						'SENTINEL_SERVICE_NAME is required for service discovery'
					);
				});
			});
		});

		describe('when config mode is single and uri exists', () => {
			const setup = () => {
				const config = {
					MODE: ValkeyMode.SINGLE,
					URI: 'redis://localhost:6379',
				};

				// @ts-expect-error Test only
				const constructorSpy = jest.spyOn(Valkey.prototype, 'constructor');

				return { config, constructorSpy };
			};

			it('returns a ValkeyClient instance', async () => {
				const { config } = setup();

				const redisInstance = await ValkeyFactory.build(config, logger, domainErrorHandler);

				expect(redisInstance).toBeInstanceOf(ValkeyClient);
			});

			it('create new Valkey instance with correctly props', async () => {
				const { config, constructorSpy } = setup();

				await ValkeyFactory.build(config, logger, domainErrorHandler);

				expect(constructorSpy).toHaveBeenCalledWith(config.URI);
			});

			describe('when throws an error', () => {
				it('URI is required for creating a new Valkey instance', async () => {
					const { config } = setup();
					config.URI = 'wrongURI';

					await expect(ValkeyFactory.build(config, logger, domainErrorHandler)).rejects.toThrow('URI is not valid');
				});
			});
		});

		describe('when config mode is single and uri undefined', () => {
			const setup = () => {
				const config = {
					MODE: ValkeyMode.SINGLE,
					URI: undefined,
				};

				return { config };
			};

			it('URI is required for creating a new Valkey instance', async () => {
				const { config } = setup();

				await expect(ValkeyFactory.build(config, logger, domainErrorHandler)).rejects.toThrow('URI is not valid');
			});
		});
	});
});
