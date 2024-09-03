import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Page } from '@shared/domain/domainobject';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { cleanupCollections } from '@shared/testing';
import { Room } from '../domain/do/room.do';
import { RoomDomainMapper } from './room-domain.mapper';
import { RoomRepo } from './room.repo';
import { roomEntityFactory } from '../testing';
import { RoomEntity } from './entity/room.entity';

describe('RoomRepo', () => {
	let module: TestingModule;
	let repo: RoomRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
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

	describe('findRooms', () => {
		const setup = async () => {
			const roomEntities = roomEntityFactory.buildWithId();
			await em.persistAndFlush([roomEntities]);
			em.clear();

			const room = RoomDomainMapper.mapEntityToDo(roomEntities);
			const page = new Page<Room>([room], 1);

			return { roomEntities, room, page };
		};

		it('should return rooms domain object', async () => {
			const { room } = await setup();
			const result = await repo.findRooms({});

			expect(result.data[0]).toEqual(room);
		});

		it('should return paginated Roms', async () => {
			const { page } = await setup();
			const result = await repo.findRooms({ pagination: { skip: 0, limit: 10 } });

			expect(result).toEqual(page);
		});
	});

	describe('entityName', () => {
		it('should return RoomEntity', () => {
			expect(repo.entityName).toBe(RoomEntity);
		});
	});

	/*
	describe('saveRoom', () => {
		const setup = () => {
			const room = roomFactory.buildWithId();

			return { room };
		};

		it('should return saved room', async () => {
			const { room } = setup();
			const result = await repo.saveRoom(room);

			expect(result).toEqual(room);
		});

		it('should save room to database', async () => {
			const { room } = await setup();
			await repo.saveRoom(room);

			const roomEntity = await em.findOne(RoomEntity, { id: room.id });

			expect(roomEntity).toBeDefined();
		});
	});
	*/
});
