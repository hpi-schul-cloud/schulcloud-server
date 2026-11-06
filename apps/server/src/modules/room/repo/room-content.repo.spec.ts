import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { RoomContentType } from '../domain/type/room-content-type.enum';
import { RoomContentEntity } from './entity';
import { RoomContentRepo } from './room-content.repo';

describe(RoomContentRepo.name, () => {
	let module: TestingModule;
	let repo: RoomContentRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [RoomContentEntity] })],
			providers: [RoomContentRepo],
		}).compile();
		repo = module.get(RoomContentRepo);
		em = module.get(EntityManager);
	});

	afterEach(async () => {
		em.clear();
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should persist replacement order and empty content through explicit flushes', async () => {
		const roomId = new ObjectId().toHexString();
		const items = [0, 1].map(() => {
			return { id: new ObjectId().toHexString(), type: RoomContentType.BOARD };
		});
		await repo.createContent(roomId, items);

		await repo.updateRoomContent(roomId, [items[1], items[0]]);
		em.clear();
		expect(await repo.findContentItemsByRoomId(roomId)).toEqual([items[1], items[0]]);

		await repo.updateRoomContent(roomId, []);
		em.clear();
		expect(await repo.findContentItemsByRoomId(roomId)).toEqual([]);
	});

	it('should persist an appended item only once', async () => {
		const roomId = new ObjectId().toHexString();
		const item = { id: new ObjectId().toHexString(), type: RoomContentType.BOARD };
		await repo.createContent(roomId, []);

		await repo.addItemToRoomContent(roomId, item);
		await repo.addItemToRoomContent(roomId, item);
		em.clear();

		expect(await repo.findContentItemsByRoomId(roomId)).toEqual([item]);
	});
});
