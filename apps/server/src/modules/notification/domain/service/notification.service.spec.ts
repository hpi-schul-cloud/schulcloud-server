import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { NotificationType } from '../../types';
import { type NotificationRepo } from '../interfaces';
import { NotificationService } from './notification.service';
import { notificationFactory } from '../testing';

describe(NotificationService.name, () => {
	let module: TestingModule;
	let sut: NotificationService;
	let notificationRepoMock: DeepMocked<NotificationRepo>;
	const NOTIFICATION_REPO = Symbol('NOTIFICATION_REPO');

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: NOTIFICATION_REPO,
					useValue: createMock<NotificationRepo>(),
				},
				{
					provide: NotificationService,
					useFactory: (notificationRepo: NotificationRepo) => new NotificationService(notificationRepo),
					inject: [NOTIFICATION_REPO],
				},
			],
		}).compile();

		sut = module.get(NotificationService);
		notificationRepoMock = module.get(NOTIFICATION_REPO);
	});

	afterEach(async () => {
		await module.close();
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('create', () => {
		describe('when a notification is created', () => {
			const setup = () => {
				const notification = {
					type: NotificationType.ERROR,
					key: 'ERROR_KEY',
					arguments: {},
					userId: 'user-id',
					expiresAt: new Date(),
				};

				return { notification };
			};

			it('should create a notification', async () => {
				const { notification } = setup();

				await sut.createNotification(notification);

				expect(notificationRepoMock.create).toHaveBeenCalledWith(
					expect.objectContaining({
						id: expect.any(String),
						type: notification.type,
						key: notification.key,
						arguments: notification.arguments,
						expiresAt: expect.any(Date),
					})
				);
			});
		});
	});

	describe('getUnreadNotifications', () => {
		describe('when getting unread notifications for a user', () => {
			const setup = () => {
				const userId = 'user-id';
				const notifications = notificationFactory.buildList(3, { userId });

				notificationRepoMock.findForUser.mockResolvedValue(notifications);

				return { userId, notifications };
			};

			it('should call the repository with the user id', async () => {
				const { userId } = setup();

				await sut.getUnreadNotifications(userId);

				expect(notificationRepoMock.findForUser).toHaveBeenCalledWith(userId);
			});

			it('should return the notifications', async () => {
				const { userId, notifications } = setup();

				const result = await sut.getUnreadNotifications(userId);

				expect(result).toEqual(notifications);
			});
		});
	});

	describe('deleteNotification', () => {
		describe('when deleting a notification', () => {
			const setup = () => {
				const notificationId = 'notification-id';

				notificationRepoMock.delete.mockResolvedValue();

				return { notificationId };
			};

			it('should call the repository with the notification id', async () => {
				const { notificationId } = setup();

				await sut.deleteNotification(notificationId);

				expect(notificationRepoMock.delete).toHaveBeenCalledWith(notificationId);
			});
		});
	});
});
