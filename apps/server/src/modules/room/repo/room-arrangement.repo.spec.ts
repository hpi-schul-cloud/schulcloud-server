import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { RoomArrangementEntity } from './entity';
import { RoomArrangementRepo } from './room-arrangement.repo';

describe(RoomArrangementRepo.name, () => {
	let module: TestingModule;
	let repo: RoomArrangementRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [RoomArrangementEntity] })],
			providers: [RoomArrangementRepo],
		}).compile();
		repo = module.get(RoomArrangementRepo);
		em = module.get(EntityManager);
	});

	afterEach(async () => {
		em.clear();
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should persist replacement order and empty arrangements without changing another user', async () => {
		const userId = new ObjectId().toHexString();
		const otherUserId = new ObjectId().toHexString();
		const items = [{ id: new ObjectId().toHexString() }, { id: new ObjectId().toHexString() }];
		await repo.createArrangement(userId, items);
		await repo.createArrangement(otherUserId, items);

		await repo.updateArrangement(userId, [items[1], items[0]]);
		em.clear();
		expect(await repo.findItemsByUserId(userId)).toEqual([items[1], items[0]]);
		expect(await repo.findItemsByUserId(otherUserId)).toEqual(items);

		await repo.updateArrangement(userId, []);
		em.clear();
		expect(await repo.findItemsByUserId(userId)).toEqual([]);
		expect(await repo.findItemsByUserId(otherUserId)).toEqual(items);
	});

	it('should delete only the requested user arrangement and return its identifier', async () => {
		const userId = new ObjectId().toHexString();
		const otherUserId = new ObjectId().toHexString();
		await repo.createArrangement(userId, []);
		await repo.createArrangement(otherUserId, []);
		const arrangement = await em.findOneOrFail(RoomArrangementEntity, { userId });

		const deletedIds = await repo.deleteArrangements(userId);
		em.clear();

		expect(deletedIds).toEqual([arrangement.id]);
		expect(await repo.hasArrangementForUserId(userId)).toBe(false);
		expect(await repo.hasArrangementForUserId(otherUserId)).toBe(true);
		expect(await repo.deleteArrangements(userId)).toEqual([]);
	});
});
