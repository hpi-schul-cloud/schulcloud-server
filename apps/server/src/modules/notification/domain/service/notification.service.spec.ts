import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotificationService } from './notification.service';
import { NotificationType } from '../../types';
import { Logger } from '@core/logger';
import { NotificationRepo } from '../interfaces';

describe(NotificationService.name, () => {
	let module: TestingModule;
	let sut: NotificationService;
	let loggerMock: DeepMocked<Logger>;
	let notificationRepoMock: DeepMocked<NotificationRepo>;
	const NOTIFICATION_REPO = Symbol('NOTIFICATION_REPO');

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: NOTIFICATION_REPO,
					useValue: createMock<NotificationRepo>(),
				},
				{
					provide: NotificationService,
					useFactory: (logger: Logger, notificationRepo: NotificationRepo) =>
						new NotificationService(logger, notificationRepo),
					inject: [Logger, NOTIFICATION_REPO],
				},
			],
		}).compile();

		sut = module.get(NotificationService);
		loggerMock = module.get(Logger);
		notificationRepoMock = module.get(NOTIFICATION_REPO);
	});

	afterEach(async () => {
		await module.close();
		jest.clearAllMocks();
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
					arguments: ['arg1'],
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

			it('should log an information', async () => {
				const { notification } = setup();

				await sut.createNotification(notification);

				expect(loggerMock.info).toHaveBeenCalledTimes(1);
			});
		});
	});
});
