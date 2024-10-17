import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission, RoleName } from '@shared/domain/interface';
import { cleanupCollections, groupEntityFactory, roleFactory, schoolEntityFactory, userFactory } from '@shared/testing';
import { GroupRepo } from '@src/modules/group';
import { GroupUserEmbeddable } from '@src/modules/group/entity';
import { GroupEntityTypes } from '@src/modules/group/entity/group.entity';
import { roomMemberEntityFactory } from '../testing';
import { RoomMemberEntity } from './entity/room-member.entity';
import { RoomMemberDomainMapper } from './room-member-domain.mapper';
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

	describe('findById', () => {
		const setup = async () => {
			const user = userFactory.buildWithId();
			const role = roleFactory.buildWithId({ name: RoleName.ROOM_EDITOR });
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [{ role, user }],
				type: GroupEntityTypes.ROOM,
			});
			const roomMemberEntity = roomMemberEntityFactory.buildWithId({ userGroupId: userGroupEntity.id });
			await em.persistAndFlush([user, userGroupEntity, roomMemberEntity]);
			em.clear();

			return { roomMemberEntity, userGroupEntity };
		};

		it('should be able to find a room member by id', async () => {
			const { roomMemberEntity, userGroupEntity } = await setup();

			const result = await repo.findById(roomMemberEntity.id);
			expect(result?.id).toEqual(roomMemberEntity.id);
			expect(result?.userGroupId.toHexString()).toEqual(userGroupEntity.id);
			expect(result?.roomId).toEqual(roomMemberEntity.roomId);
			expect(result?.members.length).toEqual(userGroupEntity.users.length);
			expect(result?.members[0].userId.toHexString()).toEqual(userGroupEntity.users[0].user.id);
			expect(result?.members[0].role.id).toEqual(userGroupEntity.users[0].role.id);
		});
	});

	describe('save', () => {
		const setup = async () => {
			const existingUser = userFactory.buildWithId();
			const existingRole = roleFactory.buildWithId({
				name: RoleName.ROOM_EDITOR,
				permissions: [Permission.ROOM_EDIT, Permission.ROOM_VIEW],
			});

			const exisitingGroup = groupEntityFactory.buildWithId({
				type: GroupEntityTypes.ROOM,
				users: [{ role: existingRole, user: existingUser }],
				organization: schoolEntityFactory.buildWithId(),
				externalSource: undefined,
			});

			await em.persistAndFlush([existingUser, existingRole, exisitingGroup]);
			em.clear();

			return { existingUser, existingRole, exisitingGroup };
		};

		it('should save a single room member', async () => {
			const { existingUser, existingRole, exisitingGroup } = await setup();

			const roomMemberEntity = roomMemberEntityFactory.build({ roomId: 'room-id', userGroupId: exisitingGroup.id });
			const groupUserEmbeddable = new GroupUserEmbeddable({ user: existingUser, role: existingRole });
			const roomMember = RoomMemberDomainMapper.mapEntityToDo(roomMemberEntity, [groupUserEmbeddable]);
			await repo.save(roomMember);

			const savedMember = await em.findOne(RoomMemberEntity, roomMember.id);
			expect(savedMember).toBeDefined();
			expect(savedMember?.id).toEqual(roomMember.id);
			expect(savedMember?.roomId).toEqual(roomMember.roomId);
			expect(savedMember?.userGroupId).toEqual(roomMember.userGroupId);
		});

		it('should save multiple room members', async () => {
			const { existingUser, existingRole, exisitingGroup } = await setup();
			const roomMemberEntityList = roomMemberEntityFactory.buildList(3, { userGroupId: exisitingGroup.id });
			const groupUserEmbeddable = new GroupUserEmbeddable({ user: existingUser, role: existingRole });
			const roomMemberList = roomMemberEntityList.map((member) =>
				RoomMemberDomainMapper.mapEntityToDo(member, [groupUserEmbeddable])
			);
			await repo.save(roomMemberList);

			const savedMembers = await Promise.all(
				roomMemberList.map(async (member) => {
					const savedMember = await em.findOne(RoomMemberEntity, member.id);
					expect(savedMember).toBeDefined();
					expect(savedMember?.id).toEqual(member.id);
					return savedMember;
				})
			);

			expect(savedMembers).toHaveLength(roomMemberList.length);
			expect(savedMembers.map((m) => m?.id)).toEqual(roomMemberList.map((m) => m.id));
		});
	});

	describe('delete', () => {
		it('should delete a single room member', async () => {
			const roomMemberEntity = roomMemberEntityFactory.build();
			await em.persistAndFlush(roomMemberEntity);
			em.clear();

			const roomMember = RoomMemberDomainMapper.mapEntityToDo(roomMemberEntity, []);
			await repo.delete(roomMember);

			const deletedMember = await em.findOne(RoomMemberEntity, roomMember.id);
			expect(deletedMember).toBeNull();
		});

		it('should delete multiple room members', async () => {
			const roomMemberEntityList = roomMemberEntityFactory.buildList(3);
			await em.persistAndFlush(roomMemberEntityList);
			em.clear();

			const roomMemberList = roomMemberEntityList.map((member) => RoomMemberDomainMapper.mapEntityToDo(member, []));
			await repo.delete(roomMemberList);

			const deletedMembers = await Promise.all(
				roomMemberList.map(async (member) => {
					const deletedMember = await em.findOne(RoomMemberEntity, member.id);
					expect(deletedMember).toBeNull();
					return deletedMember;
				})
			);
			expect(deletedMembers).toHaveLength(roomMemberList.length);
		});
	});

	describe('findByRoomId', () => {
		const setup = async () => {
			const user = userFactory.buildWithId();
			const role = roleFactory.buildWithId({ name: RoleName.ROOM_EDITOR });
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [{ role, user }],
				type: GroupEntityTypes.ROOM,
			});
			const roomMemberEntity = roomMemberEntityFactory.buildWithId({
				userGroupId: userGroupEntity.id,
			});
			await em.persistAndFlush([user, role, userGroupEntity, roomMemberEntity]);
			em.clear();

			return { roomMemberEntity, userGroupEntity };
		};

		it('should find room member by roomId', async () => {
			const { roomMemberEntity, userGroupEntity } = await setup();

			const result = await repo.findByRoomId(roomMemberEntity.roomId.toString());

			expect(result).toBeDefined();
			expect(result?.id).toEqual(roomMemberEntity.id);
			expect(result?.userGroupId.toHexString()).toEqual(userGroupEntity.id);
		});

		it('should return null if no room member found', async () => {
			const result = await repo.findByRoomId(new ObjectId().toString());

			expect(result).toBeNull();
		});
	});

	describe('findByRoomIds', () => {
		const setup = async () => {
			const user = userFactory.buildWithId();
			const role = roleFactory.buildWithId({ name: RoleName.ROOM_EDITOR });
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [{ role, user }],
				type: GroupEntityTypes.ROOM,
			});
			const roomMemberEntities = roomMemberEntityFactory.buildList(3, {
				userGroupId: userGroupEntity.id,
			});
			await em.persistAndFlush([user, role, userGroupEntity, ...roomMemberEntities]);
			em.clear();

			return { roomMemberEntities, userGroupEntity };
		};

		it('should find room members by roomIds', async () => {
			const { roomMemberEntities, userGroupEntity } = await setup();

			const roomIds = roomMemberEntities.map((member) => member.roomId.toString());
			const result = await repo.findByRoomIds(roomIds);

			expect(result).toHaveLength(3);
			result.forEach((member, index) => {
				expect(member.id).toEqual(roomMemberEntities[index].id);
				expect(member.userGroupId.toHexString()).toEqual(userGroupEntity.id);
			});
		});

		it('should return empty array if no room members found', async () => {
			const nonExistentRoomIds = [new ObjectId().toString(), new ObjectId().toString()];
			const result = await repo.findByRoomIds(nonExistentRoomIds);

			expect(result).toEqual([]);
		});
	});

	describe('findByUserId', () => {
		const setup = async () => {
			const user = userFactory.buildWithId();
			const role = roleFactory.buildWithId({ name: RoleName.ROOM_EDITOR });
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [{ role, user }],
				type: GroupEntityTypes.ROOM,
			});
			const roomMemberEntity = roomMemberEntityFactory.buildWithId({
				userGroupId: userGroupEntity.id,
				roomId: new ObjectId().toHexString(),
			});
			await em.persistAndFlush([user, role, userGroupEntity, roomMemberEntity]);
			em.clear();

			return { user, userGroupEntity, roomMemberEntity };
		};

		it('should find room members by userId', async () => {
			const { user, userGroupEntity, roomMemberEntity } = await setup();

			const result = await repo.findByUserId(user.id);

			expect(result).toHaveLength(1);
			expect(result[0].id).toEqual(roomMemberEntity.id);
			expect(result[0].userGroupId.toHexString()).toEqual(userGroupEntity.id);
			expect(result[0].roomId.toHexString()).toEqual(roomMemberEntity.roomId);
			expect(result[0].members).toHaveLength(1);
			expect(result[0].members[0].userId.toHexString()).toEqual(user.id);
		});

		it('should return empty array if no room members found', async () => {
			const nonExistentUserId = new ObjectId().toHexString();
			const result = await repo.findByUserId(nonExistentUserId);

			expect(result).toEqual([]);
		});
	});
});
