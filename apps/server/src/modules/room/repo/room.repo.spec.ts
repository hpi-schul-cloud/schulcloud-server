import { NotFoundError } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Page } from '@shared/domain/domainobject';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { Room } from '../domain/do/room.do';
import { roomEntityFactory, roomFactory } from '../testing';
import { RoomEntity } from './entity';
import { RoomDomainMapper } from './room-domain.mapper';
import { RoomRepo } from './room.repo';

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

	describe('findById', () => {
		const setup = async () => {
			const roomEntity = roomEntityFactory.buildWithId();
			await em.persistAndFlush(roomEntity);
			em.clear();

			return { roomEntity };
		};

		it('should be able to find a room by id', async () => {
			const { roomEntity } = await setup();

			const result = await repo.findById(roomEntity.id);

			expect(result.getProps()).toMatchObject(roomEntity);
		});
	});

	describe('save', () => {
		const setup = () => {
			const rooms = roomFactory.buildList(3);
			return { rooms };
		};

		it('should be able to persist a single room', async () => {
			const { rooms } = setup();

			await repo.save(rooms[0]);
			const result = await em.findOneOrFail(RoomEntity, rooms[0].id);

			expect(rooms[0].getProps()).toMatchObject(result);
		});

		it('should be able to persist many rooms', async () => {
			const { rooms } = setup();

			await repo.save(rooms);
			const result = await em.find(RoomEntity, { id: { $in: rooms.map((r) => r.id) } });

			expect(result.length).toBe(rooms.length);
		});
	});

	describe('delete', () => {
		const setup = async () => {
			const roomEntities = roomEntityFactory.buildListWithId(3);
			await em.persistAndFlush(roomEntities);
			const rooms = roomEntities.map((entity) => new Room(entity));
			em.clear();

			return { rooms };
		};

		it('should be able to delete a single room', async () => {
			const { rooms } = await setup();

			await repo.delete(rooms[0]);

			await expect(em.findOneOrFail(RoomEntity, rooms[0].id)).rejects.toThrow(NotFoundError);
		});

		it('should be able to delete many rooms', async () => {
			const { rooms } = await setup();

			await repo.delete(rooms);

			const remainingCount = await em.count(RoomEntity);
			expect(remainingCount).toBe(0);
		});
	});

	describe('findRoomsByIds', () => {
		const setup = async () => {
			const roomEntities = roomEntityFactory.buildListWithId(5);
			await em.persistAndFlush(roomEntities);
			em.clear();

			const rooms = roomEntities.map((entity) => RoomDomainMapper.mapEntityToDo(entity));
			const roomIds = rooms.map((room) => room.id);

			return { rooms, roomIds };
		};

		it('should return rooms with matching ids', async () => {
			const { roomIds } = await setup();

			const result = await repo.findRoomsByIds(roomIds.slice(0, 3), {});

			expect(result.data.length).toBe(3);
			expect(result.data.map((room) => room.id)).toEqual(expect.arrayContaining(roomIds.slice(0, 3)));
		});

		it('should return paginated results', async () => {
			const { roomIds } = await setup();

			const result = await repo.findRoomsByIds(roomIds, { pagination: { skip: 2, limit: 2 } });

			expect(result.data.length).toBe(2);
			expect(result.total).toBe(5);
		});

		it('should return empty array if no matching ids', async () => {
			await setup();

			const result = await repo.findRoomsByIds(['nonexistent-id'], {});

			expect(result.data).toEqual([]);
			expect(result.total).toBe(0);
		});
	});

	describe('findByIds', () => {
		const setup = async () => {
			const roomEntities = roomEntityFactory.buildListWithId(3);
			await em.persistAndFlush(roomEntities);
			em.clear();

			return { roomEntities };
		};

		it('should return rooms for given ids', async () => {
			const { roomEntities } = await setup();
			const ids = roomEntities.map((entity) => entity.id);

			const result = await repo.findByIds(ids);

			expect(result.length).toBe(3);
			expect(result.map((room) => room.id)).toEqual(expect.arrayContaining(ids));
		});

		it('should return empty array if no ids match', async () => {
			await setup();

			const result = await repo.findByIds(['nonexistent-id']);

			expect(result).toEqual([]);
		});
	});
});
