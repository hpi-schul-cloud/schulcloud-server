import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { GroupService } from '@modules/group';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { groupFactory } from '../../group/testing';
import { GroupProvisioningSuccessfulLoggable, GroupRemovalSuccessfulLoggable } from '../loggable';
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
	let configService: DeepMocked<ConfigService>;

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
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		consumer = module.get(SchulconnexGroupProvisioningConsumer);
		logger = module.get(Logger);
		schulconnexGroupProvisioningService = module.get(SchulconnexGroupProvisioningService);
		schulconnexCourseSyncService = module.get(SchulconnexCourseSyncService);
		groupService = module.get(GroupService);
		configService = module.get(ConfigService);
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
				configService.get.mockReturnValueOnce(true);

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
				configService.get.mockReturnValueOnce(true);

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
				configService.get.mockReturnValueOnce(true);

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
				configService.get.mockReturnValueOnce(false);

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
		});
	});

	describe('removeUserFromGroup', () => {
		describe('when the user gets removed from a group', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const removedGroup = groupFactory.build();

				schulconnexGroupProvisioningService.removeUserFromGroup.mockResolvedValueOnce(removedGroup);
				configService.get.mockReturnValueOnce(true);

				return {
					userId,
					removedGroup,
				};
			};

			it('should remove the user from the group', async () => {
				const { userId, removedGroup } = setup();

				await consumer.removeUserFromGroup({
					userId,
					groupId: removedGroup.id,
				});

				expect(schulconnexGroupProvisioningService.removeUserFromGroup).toHaveBeenCalledWith(userId, removedGroup.id);
			});

			it('should synchronize the courses', async () => {
				const { userId, removedGroup } = setup();

				await consumer.removeUserFromGroup({
					userId,
					groupId: removedGroup.id,
				});

				expect(schulconnexCourseSyncService.synchronizeCourseWithGroup).toHaveBeenCalledWith(
					removedGroup,
					removedGroup
				);
			});

			it('should log a success info', async () => {
				const { userId, removedGroup } = setup();

				await consumer.removeUserFromGroup({
					userId,
					groupId: removedGroup.id,
				});

				expect(logger.info).toHaveBeenCalledWith(new GroupRemovalSuccessfulLoggable(removedGroup.id, userId, false));
			});
		});

		describe('when the group was deleted', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const removedGroup = groupFactory.build();

				schulconnexGroupProvisioningService.removeUserFromGroup.mockResolvedValueOnce(null);
				configService.get.mockReturnValueOnce(true);

				return {
					userId,
					removedGroup,
				};
			};

			it('should remove the user from the group', async () => {
				const { userId, removedGroup } = setup();

				await consumer.removeUserFromGroup({
					userId,
					groupId: removedGroup.id,
				});

				expect(schulconnexGroupProvisioningService.removeUserFromGroup).toHaveBeenCalledWith(userId, removedGroup.id);
			});

			it('should not synchronize the courses', async () => {
				const { userId, removedGroup } = setup();

				await consumer.removeUserFromGroup({
					userId,
					groupId: removedGroup.id,
				});

				expect(schulconnexCourseSyncService.synchronizeCourseWithGroup).not.toHaveBeenCalled();
			});

			it('should log a success info', async () => {
				const { userId, removedGroup } = setup();

				await consumer.removeUserFromGroup({
					userId,
					groupId: removedGroup.id,
				});

				expect(logger.info).toHaveBeenCalledWith(new GroupRemovalSuccessfulLoggable(removedGroup.id, userId, true));
			});
		});

		describe('when course synchronisation is deactivated', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const removedGroup = groupFactory.build();

				schulconnexGroupProvisioningService.removeUserFromGroup.mockResolvedValueOnce(removedGroup);
				configService.get.mockReturnValueOnce(false);

				return {
					userId,
					removedGroup,
				};
			};

			it('should not synchronize the courses', async () => {
				const { userId, removedGroup } = setup();

				await consumer.removeUserFromGroup({
					userId,
					groupId: removedGroup.id,
				});

				expect(schulconnexCourseSyncService.synchronizeCourseWithGroup).not.toHaveBeenCalled();
			});
		});
	});
});
