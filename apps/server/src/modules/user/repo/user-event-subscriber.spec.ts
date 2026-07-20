import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { schoolEntityFactory } from '@modules/school/testing';
import { SystemEntity } from '@modules/system/repo';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';
import { UserEventSubscriber } from '@modules/user/repo/user-event-subscriber';
import { User } from '@modules/user/repo/user.entity';
import { userFactory } from '@modules/user/testing';
import { EventBus } from '@nestjs/cqrs';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';

describe(UserEventSubscriber.name, () => {
	let module: TestingModule;
	let em: EntityManager;
	let eventBus: DeepMocked<EventBus>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [
						SchoolSystemOptionsEntity,
						SystemEntity,
						User,
						UserLoginMigrationEntity,
					],
					ensureIndexes: true,
				}),
			],
			providers: [
				UserEventSubscriber,
				{
					provide: EventBus,
					useValue: createMock<EventBus>(),
				},
			],
		}).compile();
		em = module.get(EntityManager);
		eventBus = module.get(EventBus);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		em.clear();
		await cleanupCollections(em);
		jest.resetAllMocks();
	});

	it('should publish event when user school changes', async () => {
		const user = userFactory.build();
		await em.persist(user).flush();
		const school1 = schoolEntityFactory.build();
		const school2 = schoolEntityFactory.build();
		user.school = school1;
		await em.persist(user).flush();
		user.school = school2;
		await em.persist(user).flush();
		expect(eventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				constructor: expect.any(Function),
				userId: user.id,
				oldSchoolId: school1.id,
			})
		);
	});

	it('should not publish event if school does not change', async () => {
		const school = schoolEntityFactory.build();
		const user = userFactory.build({ school });
		await em.persist(user).flush();
		await em.persist(user).flush(); // no change
		expect(eventBus.publish).not.toHaveBeenCalled();
	});
});
