import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { Subject, firstValueFrom, take, toArray } from 'rxjs';
import { NotificationController } from './notification.controller';
import { NotificationService } from '../domain/service';
import { NotificationObserverService } from './notification-observer.service';
import { NotificationEntity } from '../repo/entities';
import { notificationFactory } from '../domain/testing';
import { ICurrentUser } from '@infra/auth-guard';

describe(NotificationController.name, () => {
	let module: TestingModule;
	let sut: NotificationController;
	let notificationServiceMock: DeepMocked<NotificationService>;
	let notificationsSubject: Subject<NotificationEntity>;

	beforeEach(async () => {
		notificationsSubject = new Subject<NotificationEntity>();

		module = await Test.createTestingModule({
			controllers: [NotificationController],
			providers: [
				{
					provide: NotificationService,
					useValue: createMock<NotificationService>(),
				},
				{
					provide: NotificationObserverService,
					useValue: {
						notifications$: notificationsSubject.asObservable(),
					},
				},
			],
		}).compile();

		sut = module.get(NotificationController);
		notificationServiceMock = module.get(NotificationService);
	});

	afterEach(async () => {
		notificationsSubject.complete();
		await module.close();
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('stream', () => {
		describe('when streaming notifications for a user', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const currentUser: ICurrentUser = {
					userId,
					roles: [],
					schoolId: new ObjectId().toHexString(),
					accountId: new ObjectId().toHexString(),
					isExternalUser: false,
					isServiceAccount: false,
					support: false,
				};

				return { currentUser, userId };
			};

			describe('when there are no initial notifications', () => {
				it('should emit an initial event with empty notifications', async () => {
					const { currentUser } = setup();
					notificationServiceMock.getUnreadNotifications.mockResolvedValue([]);

					const stream$ = sut.stream(currentUser);
					const result = await firstValueFrom(stream$);

					expect(result).toEqual({
						data: { type: 'initial', notifications: [] },
					});
				});

				it('should call getUnreadNotifications with the user id', async () => {
					const { currentUser, userId } = setup();
					notificationServiceMock.getUnreadNotifications.mockResolvedValue([]);

					const stream$ = sut.stream(currentUser);
					await firstValueFrom(stream$);

					expect(notificationServiceMock.getUnreadNotifications).toHaveBeenCalledWith(userId);
				});

				it('should not call deleteNotification when there are no notifications', async () => {
					const { currentUser } = setup();
					notificationServiceMock.getUnreadNotifications.mockResolvedValue([]);

					const stream$ = sut.stream(currentUser);
					await firstValueFrom(stream$);

					expect(notificationServiceMock.deleteNotification).not.toHaveBeenCalled();
				});
			});

			describe('when there are initial notifications', () => {
				const setupWithNotifications = () => {
					const { currentUser, userId } = setup();
					const notifications = notificationFactory.buildList(2, { userId });

					notificationServiceMock.getUnreadNotifications.mockResolvedValue(notifications);
					notificationServiceMock.deleteNotification.mockResolvedValue();

					return { currentUser, userId, notifications };
				};

				it('should emit an initial event with the notifications', async () => {
					const { currentUser, notifications } = setupWithNotifications();

					const stream$ = sut.stream(currentUser);
					const result = await firstValueFrom(stream$);

					expect(result).toEqual({
						data: { type: 'initial', notifications },
					});
				});

				it('should delete all initial notifications', async () => {
					const { currentUser, notifications } = setupWithNotifications();

					const stream$ = sut.stream(currentUser);
					await firstValueFrom(stream$);

					expect(notificationServiceMock.deleteNotification).toHaveBeenCalledTimes(notifications.length);
					notifications.forEach((notification) => {
						expect(notificationServiceMock.deleteNotification).toHaveBeenCalledWith(notification.id);
					});
				});
			});

			describe('when a live notification is received for the user', () => {
				const setupWithLiveNotification = () => {
					const { currentUser, userId } = setup();
					const notificationId = new ObjectId();
					const notificationEntity = {
						_id: notificationId,
						userId,
						type: 'note',
						key: 'notification.key',
						arguments: [],
						expiresAt: new Date(),
					} as unknown as NotificationEntity;

					notificationServiceMock.getUnreadNotifications.mockResolvedValue([]);
					notificationServiceMock.deleteNotification.mockResolvedValue();

					return { currentUser, userId, notificationEntity, notificationId };
				};

				it('should emit a live event with the notification', async () => {
					const { currentUser, notificationEntity } = setupWithLiveNotification();

					const stream$ = sut.stream(currentUser);

					const resultPromise = firstValueFrom(stream$.pipe(take(2), toArray()));

					setTimeout(() => {
						notificationsSubject.next(notificationEntity);
					}, 10);

					const results = await resultPromise;

					expect(results[1]).toEqual({
						data: { type: 'live', notification: notificationEntity },
					});
				});

				it('should delete the live notification', async () => {
					const { currentUser, notificationEntity, notificationId } = setupWithLiveNotification();

					const stream$ = sut.stream(currentUser);

					const resultPromise = firstValueFrom(stream$.pipe(take(2), toArray()));

					setTimeout(() => {
						notificationsSubject.next(notificationEntity);
					}, 10);

					await resultPromise;

					expect(notificationServiceMock.deleteNotification).toHaveBeenCalledWith(notificationId.toString());
				});
			});

			describe('when a live notification is received for a different user', () => {
				it('should not emit the notification', async () => {
					const { currentUser } = setup();
					const otherUserId = new ObjectId().toHexString();
					const notificationEntity = {
						_id: new ObjectId(),
						userId: otherUserId,
						type: 'note',
						key: 'notification.key',
						arguments: [],
						expiresAt: new Date(),
					} as unknown as NotificationEntity;

					notificationServiceMock.getUnreadNotifications.mockResolvedValue([]);

					const stream$ = sut.stream(currentUser);
					const results: unknown[] = [];

					const subscription = stream$.subscribe((event) => {
						results.push(event);
					});

					await new Promise((resolve) => {
						setTimeout(resolve, 10);
					});

					notificationsSubject.next(notificationEntity);

					await new Promise((resolve) => {
						setTimeout(resolve, 20);
					});

					subscription.unsubscribe();

					expect(results).toHaveLength(1);
					expect(results[0]).toEqual({
						data: { type: 'initial', notifications: [] },
					});
				});
			});
		});
	});
});
