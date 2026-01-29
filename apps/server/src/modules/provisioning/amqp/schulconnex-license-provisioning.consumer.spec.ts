import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ExternalLicenseDto } from '../dto';
import { LicenseProvisioningSuccessfulLoggable } from '../loggable';
import { ENTITIES } from '../schulconnex-license-provisioning.entity.imports';
import {
	SchulconnexLicenseProvisioningService,
	SchulconnexToolProvisioningService,
} from '../strategy/schulconnex/service';
import { SchulconnexLicenseProvisioningConsumer } from './schulconnex-license-provisioning.consumer';
import { PROVISIONING_EXCHANGE_CONFIG_TOKEN } from '../provisioning-exchange.config';

describe(SchulconnexLicenseProvisioningConsumer.name, () => {
	let module: TestingModule;
	let consumer: SchulconnexLicenseProvisioningConsumer;

	let logger: DeepMocked<Logger>;
	let schulconnexLicenseProvisioningService: DeepMocked<SchulconnexLicenseProvisioningService>;
	let schulconnexToolProvisioningService: DeepMocked<SchulconnexToolProvisioningService>;

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
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('provisionGroups', () => {
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
