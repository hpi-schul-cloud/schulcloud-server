import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { RoomMembership } from '../do/room-membership.do';
import { roomMembershipEntityFactory, roomMembershipFactory } from '../testing';
import { RoomMembershipEntity } from './entity';
import { RoomMembershipRepo } from './room-membership.repo';

describe('RoomMembershipRepo', () => {
	let module: TestingModule;
	let repo: RoomMembershipRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [RoomMembershipEntity] })],
			providers: [RoomMembershipRepo],
		}).compile();

		repo = module.get(RoomMembershipRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('findByRoomId', () => {
		const setup = async () => {
			const roomMembershipEntity = roomMembershipEntityFactory.buildWithId();
			await em.persist([roomMembershipEntity]).flush();
			em.clear();

			return { roomMembershipEntity };
		};

		it('should find room member by roomId', async () => {
			const { roomMembershipEntity } = await setup();

			const roomMembership = await repo.findByRoomId(roomMembershipEntity.roomId);

			expect(roomMembership).toBeDefined();
			expect(roomMembership?.getProps()).toEqual(roomMembershipEntity);
		});
	});

	describe('findByRoomIds', () => {
		const setup = async () => {
			const roomId1 = new ObjectId().toHexString();
			const roomId2 = new ObjectId().toHexString();

			const roomMemberEntities = [
				roomMembershipEntityFactory.buildWithId({ roomId: roomId1 }),
				roomMembershipEntityFactory.buildWithId({ roomId: roomId1 }),
				roomMembershipEntityFactory.buildWithId({ roomId: roomId2 }),
			];

			await em.persist(roomMemberEntities).flush();
			em.clear();

			return { roomMemberEntities, roomId1, roomId2 };
		};

		it('should find room member by roomIds', async () => {
			const { roomId1, roomId2 } = await setup();

			const roomMemberships = await repo.findByRoomIds([roomId1, roomId2]);

			expect(roomMemberships).toHaveLength(3);
		});
	});

	describe('findByGroupId', () => {
		const setup = async () => {
			const groupId = new ObjectId().toHexString();
			const roomMemberEntities = [
				roomMembershipEntityFactory.build({ userGroupId: groupId }),
				roomMembershipEntityFactory.build({ userGroupId: groupId }),
				roomMembershipEntityFactory.build({ userGroupId: new ObjectId().toHexString() }),
			];

			await em.persist(roomMemberEntities).flush();
			em.clear();

			return { roomMemberEntities, groupId };
		};

		it('should find room members by groupId', async () => {
			const { groupId } = await setup();

			const roomMemberships = await repo.findByGroupId(groupId);

			expect(roomMemberships).toHaveLength(2);
		});
	});

	describe('save', () => {
		const setup = () => {
			const roomMemberships = roomMembershipFactory.buildList(3);
			return { roomMemberships };
		};

		it('should be able to persist a single room member', async () => {
			const { roomMemberships } = setup();

			await repo.save(roomMemberships[0]);
			const result = await em.findOneOrFail(RoomMembershipEntity, roomMemberships[0].id);

			expect(roomMemberships[0].getProps()).toMatchObject(result);
		});

		it('should be able to persist many room members', async () => {
			const { roomMemberships } = setup();

			await repo.save(roomMemberships);
			const result = await em.find(RoomMembershipEntity, { id: { $in: roomMemberships.map((r) => r.id) } });

			expect(result.length).toBe(roomMemberships.length);
		});
	});

	describe('delete', () => {
		const setup = async () => {
			const roomMemberEntities = roomMembershipEntityFactory.buildListWithId(3);
			await em.persist(roomMemberEntities).flush();
			const roomMemberships = roomMemberEntities.map((entity) => new RoomMembership(entity));
			em.clear();

			return { roomMemberships };
		};

		it('should be able to delete a single room member', async () => {
			const { roomMemberships } = await setup();

			await repo.delete(roomMemberships[0]);

			await expect(em.findOneOrFail(RoomMembershipEntity, roomMemberships[0].id)).rejects.toThrow(NotFoundError);
		});

		it('should be able to delete many rooms', async () => {
			const { roomMemberships } = await setup();

			await repo.delete(roomMemberships);

			const remainingCount = await em.count(RoomMembershipEntity);
			expect(remainingCount).toBe(0);
		});
	});
});
