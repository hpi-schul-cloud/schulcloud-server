import { NotificationRepo } from './notification.repo';
import { NotificationEntity } from './entities/notification.entity';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { TestingModule } from '@nestjs/testing/testing-module';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { NotificationType } from '../types/notification-type.enum';
import { Notification } from '../domain/do/notification.do';

describe(NotificationRepo.name, () => {
	let module: TestingModule;
	let repo: NotificationRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [NotificationEntity],
				}),
			],
			providers: [NotificationRepo],
		}).compile();

		repo = module.get(NotificationRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('defined', () => {
		it('should expose NotificationEntity as entityName', () => {
			expect(repo.entityName).toBe(NotificationEntity);
		});
	});

	describe('createNotification', () => {
		describe('when a notification entity is provided', () => {
			const setup = () => {
				// set fixed date
				const notification = new Notification({
					id: new ObjectId().toHexString(),
					type: NotificationType.NOTE,
					key: 'INFO_KEY',
					arguments: ['arg1'],
					userId: 'user-id',
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				const notificationId = notification.id;

				return { notification, notificationId };
			};
			it('should persist the notification and return the same instance', async () => {
				const { notification, notificationId } = setup();

				// const notificationEntity = {} as NotificationEntity;

				// const createdEntity = { ...notificationEntity } as NotificationEntity;
				// const createSpy = jest.spyOn(repo, 'create').mockReturnValue(createdEntity);
				// const saveSpy = jest.spyOn(repo, 'save').mockResolvedValue();

				await repo.create(notification);
				const result = await repo.findById(notificationId);

				// if the test is too slow, this will fail
				expect(result).toEqual(expect.objectContaining(notification));

				// expect(createSpy).toHaveBeenCalledTimes(1);
				// expect(createSpy).toHaveBeenCalledWith(notificationEntity);
				// expect(saveSpy).toHaveBeenCalledTimes(1);
				// expect(saveSpy).toHaveBeenCalledWith(createdEntity);
				// expect(entity).toBe(expectedDomainObject);
			});
		});
	});
});
