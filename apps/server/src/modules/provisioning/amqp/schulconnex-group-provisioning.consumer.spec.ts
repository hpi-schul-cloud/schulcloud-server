import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { GroupService } from '@modules/group';
import { groupFactory } from '@modules/group/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { GroupProvisioningSuccessfulLoggable } from '../loggable';
import { PROVISIONING_EXCHANGE_CONFIG_TOKEN } from '../provisioning-exchange.config';
import { PROVISIONING_CONFIG_TOKEN, ProvisioningConfig } from '../provisioning.config';
import { ENTITIES } from '../schulconnex-group-provisioning.entity.imports';
import { SchulconnexCourseSyncService, SchulconnexGroupProvisioningService } from '../strategy/schulconnex/service';
import { externalGroupDtoFactory, externalSchoolDtoFactory } from '../testing';
import { SchulconnexGroupProvisioningConsumer } from './schulconnex-group-provisioning.consumer';

describe(SchulconnexGroupProvisioningConsumer.name, () => {
	let module: TestingModule;
	let consumer: SchulconnexGroupProvisioningConsumer;

	let logger: DeepMocked<Logger>;
	let schulconnexGroupProvisioningService: DeepMocked<SchulconnexGroupProvisioningService>;
	let schulconnexCourseSyncService: DeepMocked<SchulconnexCourseSyncService>;
	let groupService: DeepMocked<GroupService>;
	let config: ProvisioningConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchulconnexGroupProvisioningConsumer,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: SchulconnexGroupProvisioningService,
					useValue: createMock<SchulconnexGroupProvisioningService>(),
				},
				{
					provide: SchulconnexCourseSyncService,
					useValue: createMock<SchulconnexCourseSyncService>(),
				},
				{
					provide: GroupService,
					useValue: createMock<GroupService>(),
				},
				{
					provide: PROVISIONING_CONFIG_TOKEN,
					useValue: {
						featureSchulconnexCourseSyncEnabled: true,
					},
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

		consumer = module.get(SchulconnexGroupProvisioningConsumer);
		logger = module.get(Logger);
		schulconnexGroupProvisioningService = module.get(SchulconnexGroupProvisioningService);
		schulconnexCourseSyncService = module.get(SchulconnexCourseSyncService);
		groupService = module.get(GroupService);
		config = module.get(PROVISIONING_CONFIG_TOKEN);
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
				const systemId = new ObjectId().toHexString();
				const externalSchool = externalSchoolDtoFactory.build();
				const externalGroup = externalGroupDtoFactory.build();
				const provisionedGroup = groupFactory.build();

				groupService.findByExternalSource.mockResolvedValueOnce(null);
				schulconnexGroupProvisioningService.provisionExternalGroup.mockResolvedValueOnce(provisionedGroup);
				config.featureSchulconnexCourseSyncEnabled = true;

				return {
					systemId,
					provisionedGroup,
					externalSchool,
					externalGroup,
				};
			};

			it('should provision the group', async () => {
				const { systemId, externalSchool, externalGroup } = setup();

				await consumer.provisionGroups({
					systemId,
					externalSchool,
					externalGroup,
				});

				expect(schulconnexGroupProvisioningService.provisionExternalGroup).toHaveBeenCalledWith(
					externalGroup,
					externalSchool,
					systemId
				);
			});

			it('should synchronize the courses', async () => {
				const { systemId, externalSchool, externalGroup, provisionedGroup } = setup();

				await consumer.provisionGroups({
					systemId,
					externalSchool,
					externalGroup,
				});

				expect(schulconnexCourseSyncService.synchronizeCourseWithGroup).toHaveBeenCalledWith(
					provisionedGroup,
					undefined
				);
			});

			it('should synchronize the courses from any existing course sync histories', async () => {
				const { systemId, externalSchool, externalGroup, provisionedGroup } = setup();

				await consumer.provisionGroups({
					systemId,
					externalSchool,
					externalGroup,
				});

				expect(schulconnexCourseSyncService.synchronizeCoursesFromHistory).toHaveBeenCalledWith(provisionedGroup);
			});

			it('should log a success info', async () => {
				const { systemId, externalSchool, externalGroup, provisionedGroup } = setup();

				await consumer.provisionGroups({
					systemId,
					externalSchool,
					externalGroup,
				});

				expect(logger.info).toHaveBeenCalledWith(
					new GroupProvisioningSuccessfulLoggable(provisionedGroup.id, externalGroup.externalId, systemId)
				);
			});
		});

		describe('when updating an existing group', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const externalSchool = externalSchoolDtoFactory.build();
				const externalGroup = externalGroupDtoFactory.build();
				const existingGroup = groupFactory.build();
				const provisionedGroup = groupFactory.build();

				groupService.findByExternalSource.mockResolvedValueOnce(existingGroup);
				schulconnexGroupProvisioningService.provisionExternalGroup.mockResolvedValueOnce(provisionedGroup);
				config.featureSchulconnexCourseSyncEnabled = true;

				return {
					systemId,
					existingGroup,
					provisionedGroup,
					externalSchool,
					externalGroup,
				};
			};

			it('should provision the group', async () => {
				const { systemId, externalSchool, externalGroup } = setup();

				await consumer.provisionGroups({
					systemId,
					externalSchool,
					externalGroup,
				});

				expect(schulconnexGroupProvisioningService.provisionExternalGroup).toHaveBeenCalledWith(
					externalGroup,
					externalSchool,
					systemId
				);
			});

			it('should synchronize the courses', async () => {
				const { systemId, externalSchool, externalGroup, existingGroup, provisionedGroup } = setup();

				await consumer.provisionGroups({
					systemId,
					externalSchool,
					externalGroup,
				});

				expect(schulconnexCourseSyncService.synchronizeCourseWithGroup).toHaveBeenCalledWith(
					provisionedGroup,
					existingGroup
				);
			});

			it('should not synchronize the courses from any existing course sync histories', async () => {
				const { systemId, externalSchool, externalGroup } = setup();

				await consumer.provisionGroups({
					systemId,
					externalSchool,
					externalGroup,
				});

				expect(schulconnexCourseSyncService.synchronizeCoursesFromHistory).not.toHaveBeenCalled();
			});

			it('should log a success info', async () => {
				const { systemId, externalSchool, externalGroup, provisionedGroup } = setup();

				await consumer.provisionGroups({
					systemId,
					externalSchool,
					externalGroup,
				});

				expect(logger.info).toHaveBeenCalledWith(
					new GroupProvisioningSuccessfulLoggable(provisionedGroup.id, externalGroup.externalId, systemId)
				);
			});
		});

		describe('when group provisioning fails', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const externalSchool = externalSchoolDtoFactory.build();
				const externalGroup = externalGroupDtoFactory.build();

				groupService.findByExternalSource.mockResolvedValueOnce(null);
				schulconnexGroupProvisioningService.provisionExternalGroup.mockResolvedValueOnce(null);
				config.featureSchulconnexCourseSyncEnabled = true;

				return {
					systemId,
					externalSchool,
					externalGroup,
				};
			};

			it('should not synchronize the courses', async () => {
				const { systemId, externalSchool, externalGroup } = setup();

				await consumer.provisionGroups({
					systemId,
					externalSchool,
					externalGroup,
				});

				expect(schulconnexCourseSyncService.synchronizeCourseWithGroup).not.toHaveBeenCalled();
			});

			it('should not log a success info', async () => {
				const { systemId, externalSchool, externalGroup } = setup();

				await consumer.provisionGroups({
					systemId,
					externalSchool,
					externalGroup,
				});

				expect(logger.info).not.toHaveBeenCalled();
			});
		});

		describe('when course synchronisation is deactivated', () => {
			const setup = () => {
				const systemId = new ObjectId().toHexString();
				const externalSchool = externalSchoolDtoFactory.build();
				const externalGroup = externalGroupDtoFactory.build();
				const provisionedGroup = groupFactory.build();

				groupService.findByExternalSource.mockResolvedValueOnce(null);
				schulconnexGroupProvisioningService.provisionExternalGroup.mockResolvedValueOnce(provisionedGroup);
				config.featureSchulconnexCourseSyncEnabled = false;

				return {
					systemId,
					provisionedGroup,
					externalSchool,
					externalGroup,
				};
			};

			it('should not synchronize the courses', async () => {
				const { systemId, externalSchool, externalGroup } = setup();

				await consumer.provisionGroups({
					systemId,
					externalSchool,
					externalGroup,
				});

				expect(schulconnexCourseSyncService.synchronizeCourseWithGroup).not.toHaveBeenCalled();
			});

			it('should not synchronize the courses from any existing course sync histories', async () => {
				const { systemId, externalSchool, externalGroup } = setup();

				await consumer.provisionGroups({
					systemId,
					externalSchool,
					externalGroup,
				});

				expect(schulconnexCourseSyncService.synchronizeCoursesFromHistory).not.toHaveBeenCalled();
			});
		});
	});
});
