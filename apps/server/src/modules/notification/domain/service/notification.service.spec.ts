import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotificationService } from './notification.service';
import { NotificationRepo } from '../../repo/notification.repo';
import { NotificationType } from '../../types/notification-type.enum';
import { Logger } from '@core/logger';
import { faker } from '@faker-js/faker/.';
import { Notification } from '../do';

describe(NotificationService.name, () => {
	let module: TestingModule;
	let sut: NotificationService;
	let loggerMock: DeepMocked<Logger>;
	let notificationRepoMock: DeepMocked<NotificationRepo>;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				NotificationService,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: NotificationRepo,
					useValue: createMock<NotificationRepo>(),
				},
			],
		}).compile();

		sut = module.get(NotificationService);
		loggerMock = module.get(Logger);
		notificationRepoMock = module.get(NotificationRepo);
	});

	afterEach(async () => {
		await module.close();
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('create', () => {
		describe('when notification type is created', () => {
			const setup = () => {
				const type: NotificationType = NotificationType.ERROR;
				const key: string = faker.string.alphanumeric();
				const args: string[] = [faker.string.alphanumeric(), faker.string.alphanumeric()];
				const userid: string = faker.string.alphanumeric();

				const notification = new Notification({
					id: 'testid',
					type: NotificationType.ERROR,
					key: 'ERROR_KEY',
					arguments: ['arg1'],
					userId: 'user-id',
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				return { type, key, args, userid, notification };
			};

			it('should create a notification and log a warning', async () => {
				const { notification } = setup();

				await sut.create(notification);

				expect(notificationRepoMock.create).toHaveBeenCalledWith(notification);
				expect(loggerMock.info).toHaveBeenCalledTimes(1);
			});
		});
	});
});
