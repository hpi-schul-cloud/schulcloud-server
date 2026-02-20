import { NotificationMikroOrmRepo } from './notification-mikro-orm.repo';
import { NotificationEntity } from './entities/notification.entity';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { EntityManager } from '@mikro-orm/mongodb';
import { TestingModule } from '@nestjs/testing/testing-module';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { Notification } from '../domain/do/notification.do';
import { notificationFactory } from '../domain/testing/notification.factory';
import { notificationEntityFactory } from './entities/testing/notification.entity.factory';

describe(NotificationMikroOrmRepo.name, () => {
	let module: TestingModule;
	let repo: NotificationMikroOrmRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [NotificationEntity],
				}),
			],
			providers: [NotificationMikroOrmRepo],
		}).compile();

		repo = module.get(NotificationMikroOrmRepo);
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

	describe('create', () => {
		describe('when a notification is new', () => {
			const setup = () => {
				const domainObject: Notification = notificationFactory.build();
				const notificationId = domainObject.id;

				const expectedDomainObject = {
					props: expect.objectContaining({
						id: domainObject.id,
						type: domainObject.type,
						key: domainObject.key,
						arguments: domainObject.arguments,
						userId: domainObject.userId,
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
					}) as Notification,
				};

				return {
					domainObject,
					expectedDomainObject,
					notificationId,
				};
			};

			describe('when a single Notification is given', () => {
				it('should create a new Notification', async () => {
					const { domainObject, notificationId, expectedDomainObject } = setup();
					await repo.create(domainObject);

					const result = await repo.findById(notificationId);

					expect(result).toEqual(expect.objectContaining(expectedDomainObject));
				});
			});

			describe('when an array of Notification is given', () => {
				it('should create a new Notification', async () => {
					const { domainObject, notificationId, expectedDomainObject } = setup();
					await repo.create([domainObject]);

					const result = await repo.findById(notificationId);

					expect(result).toEqual(expect.objectContaining(expectedDomainObject));
				});
			});
		});
	});

	describe('findById', () => {
		describe('when searching by Id', () => {
			const setup = async () => {
				const entity: NotificationEntity = notificationEntityFactory.build();
				await em.persist(entity).flush();

				const notification = new Notification({
					id: entity.id,
					type: entity.type,
					key: entity.key,
					arguments: entity.arguments,
					userId: entity.userId,
					createdAt: entity.createdAt,
					updatedAt: entity.updatedAt,
				});

				return {
					notification,
				};
			};

			it('should find the Notification', async () => {
				const { notification } = await setup();

				const result: Notification = await repo.findById(notification.id);

				expect(result).toEqual(expect.objectContaining(notification));
			});
		});
	});
});
