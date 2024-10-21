import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@shared/testing';
import { GroupRepo } from '@src/modules/group';
import { roomMemberEntityFactory } from '../testing';
import { RoomMemberRepo } from './room-member.repo';

describe('RoomMemberRepo', () => {
	let module: TestingModule;
	let repo: RoomMemberRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [RoomMemberRepo, GroupRepo],
		}).compile();

		repo = module.get(RoomMemberRepo);
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
			const roomMemberEntity = roomMemberEntityFactory.buildWithId();
			await em.persistAndFlush([roomMemberEntity]);
			em.clear();

			return { roomMemberEntity };
		};

		it('should find room member by roomId', async () => {
			const { roomMemberEntity } = await setup();

			const roomMembers = await repo.findByRoomId(roomMemberEntity.roomId);

			expect(roomMembers).toHaveLength(1);
		});
	});

	describe('findByRoomIds', () => {
		const setup = async () => {
			const roomId1 = new ObjectId().toHexString();
			const roomId2 = new ObjectId().toHexString();

			const roomMemberEntities = [
				roomMemberEntityFactory.buildWithId({ roomId: roomId1 }),
				roomMemberEntityFactory.buildWithId({ roomId: roomId1 }),
				roomMemberEntityFactory.buildWithId({ roomId: roomId2 }),
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

	// describe('save', () => {
	// 	// const setup = async () => {

	// 	// 	await em.persistAndFlush([existingUser, existingRole, exisitingGroup]);
	// 	// 	em.clear();

	// 	// 	return { existingUser, existingRole, exisitingGroup };
	// 	// };

	// 	it('should save a single room member', async () => {
	// 		// const { existingUser, existingRole, exisitingGroup } = await setup();

	// 		const roomMemberEntity = roomMemberEntityFactory.build();
	// 		const roomMember = RoomMemberDomainMapper.mapEntityToDo(roomMemberEntity);
	// 		await repo.save(roomMember);

	// 		const savedMember = await em.findOne(RoomMemberEntity, roomMember.id);
	// 		expect(savedMember).toBeDefined();
	// 		expect(savedMember).toEqual(roomMember);
	// 	});

	// 	// it('should save multiple room members', async () => {
	// 	// 	const { existingUser, existingRole, exisitingGroup } = await setup();
	// 	// 	const roomMemberEntityList = roomMemberEntityFactory.buildList(3, { userGroupId: exisitingGroup.id });
	// 	// 	const groupUserEmbeddable = new GroupUserEmbeddable({ user: existingUser, role: existingRole });
	// 	// 	const roomMemberList = roomMemberEntityList.map((member) =>
	// 	// 		RoomMemberDomainMapper.mapEntityToDo(member, [groupUserEmbeddable])
	// 	// 	);
	// 	// 	await repo.save(roomMemberList);

	// 	// 	const savedMembers = await Promise.all(
	// 	// 		roomMemberList.map(async (member) => {
	// 	// 			const savedMember = await em.findOne(RoomMemberEntity, member.id);
	// 	// 			expect(savedMember).toBeDefined();
	// 	// 			expect(savedMember?.id).toEqual(member.id);
	// 	// 			return savedMember;
	// 	// 		})
	// 	// 	);

	// 	// 	expect(savedMembers).toHaveLength(roomMemberList.length);
	// 	// 	expect(savedMembers.map((m) => m?.id)).toEqual(roomMemberList.map((m) => m.id));
	// 	// });
	// });

	// describe('delete', () => {
	// 	it('should delete a single room member', async () => {
	// 		const roomMemberEntity = roomMemberEntityFactory.build();
	// 		await em.persistAndFlush(roomMemberEntity);
	// 		em.clear();

	// 		const roomMember = RoomMemberDomainMapper.mapEntityToDo(roomMemberEntity, []);
	// 		await repo.delete(roomMember);

	// 		const deletedMember = await em.findOne(RoomMemberEntity, roomMember.id);
	// 		expect(deletedMember).toBeNull();
	// 	});

	// 	it('should delete multiple room members', async () => {
	// 		const roomMemberEntityList = roomMemberEntityFactory.buildList(3);
	// 		await em.persistAndFlush(roomMemberEntityList);
	// 		em.clear();

	// 		const roomMemberList = roomMemberEntityList.map((member) => RoomMemberDomainMapper.mapEntityToDo(member, []));
	// 		await repo.delete(roomMemberList);

	// 		const deletedMembers = await Promise.all(
	// 			roomMemberList.map(async (member) => {
	// 				const deletedMember = await em.findOne(RoomMemberEntity, member.id);
	// 				expect(deletedMember).toBeNull();
	// 				return deletedMember;
	// 			})
	// 		);
	// 		expect(deletedMembers).toHaveLength(roomMemberList.length);
	// 	});
	// });
});
