import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { NotificationService } from './notification.service';
import { NotificationRepo } from '../repo/notification.repo';
import { NotificationDto } from '../dto/notification.dto';
import { NotificationType } from '../dto/notification-type.enum';
import { NotificationEntity } from '../entities/notification.entity';
import { Logger } from '@core/logger';
import { faker } from '@faker-js/faker/.';

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

	const setup = () => {
		const type: NotificationType = NotificationType.ERROR;
		const key: string = faker.string.alphanumeric();
		const args: string[] = [faker.string.alphanumeric(), faker.string.alphanumeric()];
		const userid: string = faker.string.alphanumeric();

		const dto: NotificationDto = {
			notificationType: NotificationType.ERROR,
			notificationKey: 'ERROR_KEY',
			notificationArguments: ['arg1'],
			userId: 'user-id',
		};

		const mappedEntity: NotificationEntity = {
			notificationType: dto.notificationType,
			notifcationKey: dto.notificationKey,
			notificationArguments: dto.notificationArguments,
			userId: dto.userId,
			_id: new ObjectId(),
			id: '',
			createdAt: new Date(),
			updatedAt: new Date(),
		} as unknown as NotificationEntity;

		// mock answer of repo
		notificationRepoMock.createAndSaveNotification.mockResolvedValue(mappedEntity);
		
		return { type, key, args, userid, dto, mappedEntity};
	};

	afterEach(async () => {
		await module.close();
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('create', () => {
		describe('when notification type is ERROR', () => {
			it('should create a notification and log a warning', async () => {
				const dto: NotificationDto = {
					notificationType: NotificationType.ERROR,
					notificationKey: 'ERROR_KEY',
					notificationArguments: ['arg1'],
					userId: 'user-id',
				};

				const mappedEntity: NotificationEntity = {
					notificationType: dto.notificationType,
					notifcationKey: dto.notificationKey,
					notificationArguments: dto.notificationArguments,
					userId: dto.userId,
					_id: new ObjectId(),
					id: '',
					createdAt: new Date(),
					updatedAt: new Date(),
				} as unknown as NotificationEntity;

				const mapSpy = jest.spyOn(NotificationRepo, 'mapDtoToEntity').mockReturnValue(mappedEntity);

				notificationRepoMock.createAndSaveNotification.mockResolvedValue(mappedEntity);

				const result = await sut.create(dto);

				expect(mapSpy).toHaveBeenCalledWith(dto);
				expect(notificationRepoMock.createAndSaveNotification).toHaveBeenCalledWith(mappedEntity);
				expect(loggerMock.warning).toHaveBeenCalledTimes(1);
				expect(loggerMock.info).not.toHaveBeenCalled();
				expect(result).toBe(mappedEntity);
			});
		});

		describe('when notification type is NOTE', () => {
			it('should create a notification and log info', async () => {
				const dto: NotificationDto = {
					notificationType: NotificationType.NOTE,
					notificationKey: 'INFO_KEY',
					notificationArguments: ['arg1'],
					userId: 'user-id',
				};

				const mappedEntity: NotificationEntity = {
					notificationType: dto.notificationType,
					notifcationKey: dto.notificationKey,
					notificationArguments: dto.notificationArguments,
					userId: dto.userId,
					_id: new ObjectId(),
					id: '',
					createdAt: new Date(),
					updatedAt: new Date(),
				} as unknown as NotificationEntity;

				const mapSpy = jest.spyOn(NotificationRepo, 'mapDtoToEntity').mockReturnValue(mappedEntity);

				notificationRepoMock.createAndSaveNotification.mockResolvedValue(mappedEntity);

				const result = await sut.create(dto);

				expect(mapSpy).toHaveBeenCalledWith(dto);
				expect(notificationRepoMock.createAndSaveNotification).toHaveBeenCalledWith(mappedEntity);
				expect(loggerMock.info).toHaveBeenCalledTimes(1);
				expect(loggerMock.warning).not.toHaveBeenCalled();
				expect(result).toBe(mappedEntity);
			});
		});
	});

	describe('findAll', () => {
		describe('when called without parameters', () => {
			it('should return the expected message', () => {
				expect(sut.findAll()).toBe('This action returns all notification');
			});
		});
	});

	describe('findOne', () => {
		describe('when called with an id', () => {
			it('should return the expected message with id', () => {
				const id = 42;
				expect(sut.findOne(id)).toBe(`This action returns a #${id} notification`);
			});
		});
	});

	describe('remove', () => {
		describe('when called with an id', () => {
			it('should return the expected message with id', () => {
				const id = 7;
				expect(sut.remove(id)).toBe(`This action removes a #${id} notification`);
			});
		});
	});
});
