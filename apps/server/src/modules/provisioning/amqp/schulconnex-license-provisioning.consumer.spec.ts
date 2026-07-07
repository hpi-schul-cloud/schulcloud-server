import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@infra/logger';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, type TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { type SchulconnexLicenseProvisioningMessage } from '../domain';
import { ExternalLicenseDto } from '../dto';
import { LicenseProvisioningSuccessfulLoggable } from '../loggable';
import { PROVISIONING_EXCHANGE_CONFIG_TOKEN } from '../provisioning-exchange.config';
import { ENTITIES } from '../schulconnex-license-provisioning.entity.imports';
import {
	SchulconnexLicenseProvisioningService,
	SchulconnexToolProvisioningService,
} from '../strategy/schulconnex/service';
import * as AmqpSubscriberHelper from './amqp-subscriber.helper';
import { SchulconnexLicenseProvisioningConsumer } from './schulconnex-license-provisioning.consumer';
import { SchulconnexProvisioningEvents } from './schulconnex.exchange';

jest.mock('./amqp-subscriber.helper');

describe(SchulconnexLicenseProvisioningConsumer.name, () => {
	let module: TestingModule;
	let consumer: SchulconnexLicenseProvisioningConsumer;

	let logger: DeepMocked<Logger>;
	let schulconnexLicenseProvisioningService: DeepMocked<SchulconnexLicenseProvisioningService>;
	let schulconnexToolProvisioningService: DeepMocked<SchulconnexToolProvisioningService>;
	let amqpConnection: DeepMocked<AmqpConnection>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchulconnexLicenseProvisioningConsumer,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: SchulconnexLicenseProvisioningService,
					useValue: createMock<SchulconnexLicenseProvisioningService>(),
				},
				{
					provide: SchulconnexToolProvisioningService,
					useValue: createMock<SchulconnexToolProvisioningService>(),
				},
				{
					provide: MikroORM,
					useValue: await setupEntities(ENTITIES),
				},
				{
					provide: AmqpConnection,
					useValue: createMock<AmqpConnection>(),
				},
				{
					provide: PROVISIONING_EXCHANGE_CONFIG_TOKEN,
					useValue: {
						exchangeName: 'provisioning-exchange',
						exchangeType: 'direct',
					},
				},
			],
		}).compile();

		consumer = module.get(SchulconnexLicenseProvisioningConsumer);
		logger = module.get(Logger);
		schulconnexLicenseProvisioningService = module.get(SchulconnexLicenseProvisioningService);
		schulconnexToolProvisioningService = module.get(SchulconnexToolProvisioningService);
		amqpConnection = module.get(AmqpConnection);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('onModuleInit', () => {
		describe('when module is initialized', () => {
			let registerAmqpSubscriberSpy: jest.SpyInstance;

			beforeEach(() => {
				registerAmqpSubscriberSpy = jest.spyOn(AmqpSubscriberHelper, 'registerAmqpSubscriber').mockResolvedValue();
			});

			afterEach(() => {
				registerAmqpSubscriberSpy.mockRestore();
			});

			it('should register a subscriber for GROUP_PROVISIONING event', async () => {
				await consumer.onModuleInit();

				expect(registerAmqpSubscriberSpy).toHaveBeenCalledWith(
					amqpConnection,
					'provisioning-exchange',
					SchulconnexProvisioningEvents.LICENSE_PROVISIONING,
					expect.any(Function),
					SchulconnexLicenseProvisioningConsumer.name,
					logger
				);
			});

			it('should pass a handler that calls provisionLicenses for LICENSE_PROVISIONING event', async () => {
				const provisionLicensesSpy = jest.spyOn(consumer, 'provisionLicenses').mockResolvedValue();
				const payload: SchulconnexLicenseProvisioningMessage = {
					userId: new ObjectId().toHexString(),
					schoolId: new ObjectId().toHexString(),
					systemId: new ObjectId().toHexString(),
					externalLicenses: [
						new ExternalLicenseDto({
							mediumId: 'medium:1',
						}),
					],
				};

				await consumer.onModuleInit();
				const registerCalls = registerAmqpSubscriberSpy.mock.calls as unknown[][];

				const licenseProvisioningHandler = registerCalls.find(
					(call) => call[2] === SchulconnexProvisioningEvents.LICENSE_PROVISIONING
				)?.[3] as (payload: SchulconnexLicenseProvisioningMessage) => Promise<void>;

				await licenseProvisioningHandler(payload);

				expect(provisionLicensesSpy).toHaveBeenCalledWith(payload);

				provisionLicensesSpy.mockRestore();
			});
		});
	});

	describe('provisionLicenses', () => {
		describe('when provisioning a new group', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const schoolId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const externalLicenses = [
					new ExternalLicenseDto({
						mediumId: 'medium:1',
					}),
				];

				return {
					userId,
					schoolId,
					systemId,
					externalLicenses,
				};
			};

			it('should provision the licenses', async () => {
				const { userId, schoolId, systemId, externalLicenses } = setup();

				await consumer.provisionLicenses({
					userId,
					schoolId,
					systemId,
					externalLicenses,
				});

				expect(schulconnexLicenseProvisioningService.provisionExternalLicenses).toHaveBeenCalledWith(
					userId,
					externalLicenses
				);
			});

			it('should provision the external tool activations', async () => {
				const { userId, schoolId, systemId, externalLicenses } = setup();

				await consumer.provisionLicenses({
					userId,
					schoolId,
					systemId,
					externalLicenses,
				});

				expect(schulconnexToolProvisioningService.provisionSchoolExternalTools).toHaveBeenCalledWith(
					userId,
					schoolId,
					systemId
				);
			});

			it('should log a success info', async () => {
				const { userId, schoolId, systemId, externalLicenses } = setup();

				await consumer.provisionLicenses({
					userId,
					schoolId,
					systemId,
					externalLicenses,
				});

				expect(logger.info).toHaveBeenCalledWith(
					new LicenseProvisioningSuccessfulLoggable(userId, externalLicenses.length)
				);
			});
		});
	});
});
