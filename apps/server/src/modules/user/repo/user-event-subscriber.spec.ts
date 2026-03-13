import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/mongodb';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { User } from '@modules/user/repo/user.entity';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserEventSubscriber } from '@modules/user/repo/user-event-subscriber';
import { userFactory } from '@modules/user/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EventBus } from '@nestjs/cqrs';

describe(UserEventSubscriber.name, () => {
	let module: TestingModule;
	let em: EntityManager;
	let eventBus: DeepMocked<EventBus>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [User], ensureIndexes: true })],
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
