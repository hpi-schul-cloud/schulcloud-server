import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { RoomEntity } from './entity';
import { RoomRepo } from './room.repo';
import { RoomDomainFactory, RoomParams } from './room-factory';
import { RoomColor } from '../domain/type';

describe('RoomRepo', () => {
	let module: TestingModule;
	let repo: RoomRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [RoomEntity] })],
			providers: [RoomRepo],
		}).compile();

		repo = module.get(RoomRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('common service operations', () => {
		it('create and get', async () => {
			const room = RoomDomainFactory.build({
				name: 'myTestRoomThatICreate',
				color: RoomColor.RED,
				schoolId: new ObjectId().toHexString(),
			});

			await repo.save(room);

			const result = await repo.findById(room.id);
			expect(result).toEqual(room);
		});

		it('copy', async () => {
			const room = RoomDomainFactory.build({
				name: 'myTestRoomThatICreate',
				color: RoomColor.RED,
				schoolId: new ObjectId().toHexString(),
			});
			await repo.save(room);

			const original = await repo.findById(room.id);
			const copyParams: RoomParams = { ...original.getProps() };
			delete copyParams.id;
			delete copyParams.createdAt;
			delete copyParams.updatedAt;
			const copy = RoomDomainFactory.build(copyParams);

			await repo.save(copy);
			const result = await repo.findById(copy.id);
			expect(result).toEqual(copy);
		});
	});
});
