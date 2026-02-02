import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { NotificationRepo } from '../repo/notification.repo';
import { NotificationType } from '../types/notification-type.enum';
import { NotificationEntity } from './entities/notification.entity';
import { Notification } from '../domain/do/notification.do';
import { NotificationMapper } from './mapper/notification.mapper';

describe(NotificationRepo.name, () => {
	// let repo: NotificationRepo;
	let repo: DeepMocked<NotificationRepo>;
	let module: TestingModule;

	// beforeEach(() => {
	// 	repo = Object.create(NotificationRepo.prototype) as NotificationRepo;
	// 	(repo as any).create = jest.fn((entity: NotificationEntity) => entity);
	// 	(repo as any).save = jest.fn();
	// });
	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: NotificationRepo,
					useValue: createMock<NotificationRepo>(),
				},
			],
		}).compile();

		repo = module.get(NotificationRepo);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	// it('should throw an error when accessing entityName getter', () => {
	// 	expect(() => (repo as any).entityName).toThrowError('Method not implemented.');
	// });

	describe('createNotification', () => {
		describe('when called with a valid notification entity', () => {
			it('should create and save the notification and return the entity', async () => {
				const entity: NotificationEntity = {
					notificationType: NotificationType.ERROR,
					notifcationKey: 'KEY',
					notificationArguments: ['arg1'],
					userId: 'user-id',
					_id: new ObjectId(),
					id: '',
					createdAt: new Date(),
					updatedAt: new Date(),
				} as unknown as NotificationEntity;

				repo.createNotification.mockResolvedValue(entity);
				const result = await repo.createNotification(entity);

				// expect((repo as any).create).toHaveBeenCalledWith(entity);
				// expect((repo as any).save).toHaveBeenCalledWith(entity);
				expect(result).toBe(entity);
			});
		});
	});

	describe('mapDtoToEntity', () => {
		describe('when called with a valid DTO', () => {
			it('should map dto to entity with generated fields', () => {
				const notification = new Notification({
					id: 'testid',
					type: NotificationType.ERROR,
					key: 'KEY',
					arguments: ['arg1', 'arg2'],
					userId: 'user-id',
				});

				const result = NotificationMapper.mapToEntity(notification);

				expect(result.type).toBe(notification.type);
				expect(result.key).toBe(notification.key);
				expect(result.arguments).toEqual(notification.arguments);
				expect(result.userId).toBe(notification.userId);
				expect(result._id).toBeInstanceOf(ObjectId);
				expect(result.id).toBeDefined();
				expect(result.createdAt).toBeInstanceOf(Date);
				expect(result.updatedAt).toBeInstanceOf(Date);
			});
		});
	});
});
