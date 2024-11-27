import { MongoMemoryDatabaseModule } from '@infra/database';
import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@shared/testing';
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
			imports: [MongoMemoryDatabaseModule.forRoot()],
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
			await em.persistAndFlush([roomMembershipEntity]);
			em.clear();

			return { roomMembershipEntity };
		};

		it('should find room member by roomId', async () => {
			const { roomMembershipEntity } = await setup();

			const roomMember = await repo.findByRoomId(roomMembershipEntity.roomId);

			expect(roomMember).toBeDefined();
			expect(roomMember?.getProps()).toEqual(roomMembershipEntity);
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

			await em.persistAndFlush(roomMemberEntities);
			em.clear();

			return { roomMemberEntities, roomId1, roomId2 };
		};

		it('should find room member by roomIds', async () => {
			const { roomId1, roomId2 } = await setup();

			const roomMembers = await repo.findByRoomIds([roomId1, roomId2]);

			expect(roomMembers).toHaveLength(3);
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

			await em.persistAndFlush(roomMemberEntities);
			em.clear();

			return { roomMemberEntities, groupId };
		};

		it('should find room members by groupId', async () => {
			const { groupId } = await setup();

			const roomMembers = await repo.findByGroupId(groupId);

			expect(roomMembers).toHaveLength(2);
		});
	});

	describe('save', () => {
		const setup = () => {
			const roomMembers = roomMembershipFactory.buildList(3);
			return { roomMembers };
		};

		it('should be able to persist a single room member', async () => {
			const { roomMembers } = setup();

			await repo.save(roomMembers[0]);
			const result = await em.findOneOrFail(RoomMembershipEntity, roomMembers[0].id);

			expect(roomMembers[0].getProps()).toMatchObject(result);
		});

		it('should be able to persist many room members', async () => {
			const { roomMembers } = setup();

			await repo.save(roomMembers);
			const result = await em.find(RoomMembershipEntity, { id: { $in: roomMembers.map((r) => r.id) } });

			expect(result.length).toBe(roomMembers.length);
		});
	});

	describe('delete', () => {
		const setup = async () => {
			const roomMemberEntities = roomMembershipEntityFactory.buildListWithId(3);
			await em.persistAndFlush(roomMemberEntities);
			const roomMembers = roomMemberEntities.map((entity) => new RoomMembership(entity));
			em.clear();

			return { roomMembers };
		};

		it('should be able to delete a single room member', async () => {
			const { roomMembers } = await setup();

			await repo.delete(roomMembers[0]);

			await expect(em.findOneOrFail(RoomMembershipEntity, roomMembers[0].id)).rejects.toThrow(NotFoundError);
		});

		it('should be able to delete many rooms', async () => {
			const { roomMembers } = await setup();

			await repo.delete(roomMembers);

			const remainingCount = await em.count(RoomMembershipEntity);
			expect(remainingCount).toBe(0);
		});
	});
});
