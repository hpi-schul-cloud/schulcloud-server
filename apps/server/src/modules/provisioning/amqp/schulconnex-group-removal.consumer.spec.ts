import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { groupFactory } from '@modules/group/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { GroupRemovalSuccessfulLoggable } from '../loggable';
import { PROVISIONING_EXCHANGE_CONFIG_TOKEN } from '../provisioning-exchange.config';
import { PROVISIONING_CONFIG_TOKEN, ProvisioningConfig } from '../provisioning.config';
import { ENTITIES } from '../schulconnex-group-removal.entity.imports';
import { SchulconnexCourseSyncService, SchulconnexGroupProvisioningService } from '../strategy/schulconnex/service';
import { SchulconnexGroupRemovalConsumer } from './schulconnex-group-removal.consumer';

describe(SchulconnexGroupRemovalConsumer.name, () => {
	let module: TestingModule;
	let consumer: SchulconnexGroupRemovalConsumer;

	let logger: DeepMocked<Logger>;
	let schulconnexGroupProvisioningService: DeepMocked<SchulconnexGroupProvisioningService>;
	let schulconnexCourseSyncService: DeepMocked<SchulconnexCourseSyncService>;
	let config: ProvisioningConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchulconnexGroupRemovalConsumer,
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

		consumer = module.get(SchulconnexGroupRemovalConsumer);
		logger = module.get(Logger);
		schulconnexGroupProvisioningService = module.get(SchulconnexGroupProvisioningService);
		schulconnexCourseSyncService = module.get(SchulconnexCourseSyncService);
		config = module.get(PROVISIONING_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('removeUserFromGroup', () => {
		describe('when the user gets removed from a group', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const removedGroup = groupFactory.build();

				schulconnexGroupProvisioningService.removeUserFromGroup.mockResolvedValueOnce(removedGroup);
				config.featureSchulconnexCourseSyncEnabled = true;

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
				config.featureSchulconnexCourseSyncEnabled = true;

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
				config.featureSchulconnexCourseSyncEnabled = false;

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
