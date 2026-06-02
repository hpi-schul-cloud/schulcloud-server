import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/mongodb';
import { Logger } from '@core/logger';
import { NotificationObserverService } from './notification-observer.service';
import { NotificationEntity } from '../repo/entities';
import { NotificationType } from '../types';

describe(NotificationObserverService.name, () => {
	let module: TestingModule;
	let sut: NotificationObserverService;
	let emMock: DeepMocked<EntityManager>;
	let loggerMock: DeepMocked<Logger>;

	const createChangeStreamMock = () => {
		const handlers: Record<string, (data: unknown) => void> = {};
		return {
			on: jest.fn((event: string, handler: (data: unknown) => void) => {
				handlers[event] = handler;
			}),
			emit: (event: string, data: unknown) => {
				if (handlers[event]) {
					handlers[event](data);
				}
			},
		};
	};

	const createCollectionMock = (changeStreamMock: ReturnType<typeof createChangeStreamMock>) => {
		return {
			watch: jest.fn().mockReturnValue(changeStreamMock),
		};
	};

	beforeEach(async () => {
		const changeStreamMock = createChangeStreamMock();
		const collectionMock = createCollectionMock(changeStreamMock);

		module = await Test.createTestingModule({
			providers: [
				NotificationObserverService,
				{
					provide: EntityManager,
					useValue: createMock<EntityManager>({
						getCollection: jest.fn().mockReturnValue(collectionMock),
					}),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		sut = module.get(NotificationObserverService);
		emMock = module.get(EntityManager);
		loggerMock = module.get(Logger);
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

	describe('constructor', () => {
		it('should set the logger context', () => {
			expect(loggerMock.setContext).toHaveBeenCalledWith(NotificationObserverService.name);
		});
	});

	describe('onModuleInit', () => {
		describe('when the module initializes', () => {
			const setup = () => {
				const changeStreamMock = createChangeStreamMock();
				const collectionMock = createCollectionMock(changeStreamMock);
				emMock.getCollection.mockReturnValue(collectionMock as unknown as ReturnType<typeof emMock.getCollection>);

				return { changeStreamMock, collectionMock };
			};

			it('should get the notification collection', () => {
				setup();

				sut.onModuleInit();

				expect(emMock.getCollection).toHaveBeenCalledWith(NotificationEntity);
			});

			it('should watch the collection for insert operations', () => {
				const { collectionMock } = setup();

				sut.onModuleInit();

				expect(collectionMock.watch).toHaveBeenCalledWith([{ $match: { operationType: 'insert' } }], {
					fullDocument: 'updateLookup',
				});
			});

			it('should register a change event handler', () => {
				const { changeStreamMock } = setup();

				sut.onModuleInit();

				expect(changeStreamMock.on).toHaveBeenCalledWith('change', expect.any(Function));
			});

			it('should register an error event handler', () => {
				const { changeStreamMock } = setup();

				sut.onModuleInit();

				expect(changeStreamMock.on).toHaveBeenCalledWith('error', expect.any(Function));
			});
		});

		describe('when a change event with insert operation is received', () => {
			const setup = () => {
				const changeStreamMock = createChangeStreamMock();
				const collectionMock = createCollectionMock(changeStreamMock);
				emMock.getCollection.mockReturnValue(collectionMock as unknown as ReturnType<typeof emMock.getCollection>);

				const notificationEntity: Partial<NotificationEntity> = {
					id: 'notification-id',
					userId: 'user-id',
					type: NotificationType.NOTE,
					key: 'notification.key',
					arguments: [],
					expiresAt: new Date(),
				};

				const changeEvent = {
					operationType: 'insert',
					fullDocument: notificationEntity,
				};

				return { changeStreamMock, changeEvent, notificationEntity };
			};

			it('should log the notification', () => {
				const { changeStreamMock, changeEvent } = setup();

				sut.onModuleInit();
				changeStreamMock.emit('change', changeEvent);

				expect(loggerMock.info).toHaveBeenCalled();
			});

			it('should emit the notification through the subject', (done) => {
				const { changeStreamMock, changeEvent, notificationEntity } = setup();

				sut.onModuleInit();

				sut.notifications$.subscribe((notification) => {
					expect(notification).toEqual(notificationEntity);
					done();
				});

				changeStreamMock.emit('change', changeEvent);
			});
		});

		describe('when an error event is received', () => {
			const setup = () => {
				const changeStreamMock = createChangeStreamMock();
				const collectionMock = createCollectionMock(changeStreamMock);
				emMock.getCollection.mockReturnValue(collectionMock as unknown as ReturnType<typeof emMock.getCollection>);

				const error = new Error('ChangeStream error');

				return { changeStreamMock, error };
			};

			it('should log a warning', () => {
				const { changeStreamMock, error } = setup();

				sut.onModuleInit();
				changeStreamMock.emit('error', error);

				expect(loggerMock.warning).toHaveBeenCalled();
			});
		});
	});

	describe('notifications$', () => {
		describe('when getting the notifications observable', () => {
			it('should return an observable', () => {
				const observable = sut.notifications$;

				expect(observable).toBeDefined();
				expect(typeof observable.subscribe).toBe('function');
			});
		});
	});
});
