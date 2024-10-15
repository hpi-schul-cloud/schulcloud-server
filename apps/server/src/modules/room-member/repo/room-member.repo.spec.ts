import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission, RoleName } from '@shared/domain/interface';
import { cleanupCollections, groupEntityFactory, roleFactory, userFactory } from '@shared/testing';
import { roomMemberEntityFactory } from '../testing';
import { RoomMemberEntity } from './entity/room-member.entity';
import { RoomMemberRepo } from './room-member.repo';

describe('RoomMemberRepo', () => {
	let module: TestingModule;
	let repo: RoomMemberRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [RoomMemberRepo],
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
			});
			const roomMemberEntity = roomMemberEntityFactory.buildWithId({ userGroup: userGroupEntity });
			await em.persistAndFlush([user, userGroupEntity, roomMemberEntity]);
			em.clear();

			return { roomMemberEntity, userGroupEntity };
		};

		it('should be able to find a room member by id', async () => {
			const { roomMemberEntity, userGroupEntity } = await setup();

			const result = await repo.findById(roomMemberEntity.id);
			expect(result?.id).toEqual(roomMemberEntity.id);
			expect(result?.userGroup?.id).toEqual(userGroupEntity.id);
			const userGroupIds = result?.userGroup?.users.map((u) => {
				return { userId: u.user.id, roleId: u.role.id };
			});
			const expectedUserGroupIds = userGroupEntity.users.map((u) => {
				return { userId: u.user.id, roleId: u.role.id };
			});
			expect(userGroupIds).toEqual(expectedUserGroupIds);
		});
	});

	describe('save', () => {
		const setup = async () => {
			const existingUser = userFactory.buildWithId();
			const existingRole = roleFactory.buildWithId({
				name: RoleName.ROOM_EDITOR,
				permissions: [Permission.ROOM_EDIT, Permission.ROOM_VIEW],
			});

			await em.persistAndFlush([existingUser, existingRole]);
			em.clear();

			return { existingUser, existingRole };
		};

		it('should save a single room member', async () => {
			const { existingUser, existingRole } = await setup();
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [{ role: existingRole, user: existingUser }],
				organization: undefined,
				externalSource: undefined,
			});
			const roomMember = roomMemberEntityFactory.build({ userGroup: userGroupEntity });
			await repo.save(roomMember);

			const savedMember = await em.findOne(RoomMemberEntity, roomMember.id);
			expect(savedMember).toBeDefined();
			expect(savedMember?.id).toEqual(roomMember.id);
		});

		it('should save multiple room members', async () => {
			const { existingUser, existingRole } = await setup();
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [{ role: existingRole, user: existingUser }],
				organization: undefined,
				externalSource: undefined,
			});
			const roomMembers = roomMemberEntityFactory.buildList(3, { userGroup: userGroupEntity });

			await repo.save(roomMembers);

			const savedMembers = await Promise.all(
				roomMembers.map(async (member) => {
					const savedMember = await em.findOne(RoomMemberEntity, member.id);
					expect(savedMember).toBeDefined();
					expect(savedMember?.id).toEqual(member.id);
					return savedMember;
				})
			);

			expect(savedMembers).toHaveLength(roomMembers.length);
			expect(savedMembers.map((m) => m?.id)).toEqual(roomMembers.map((m) => m.id));
		});
	});

	describe('delete', () => {
		it('should delete a single room member', async () => {
			const roomMember = roomMemberEntityFactory.build();
			await em.persistAndFlush(roomMember);
			em.clear();

			await repo.delete(roomMember);

			const deletedMember = await em.findOne(RoomMemberEntity, roomMember.id);
			expect(deletedMember).toBeNull();
		});

		it('should delete multiple room members', async () => {
			const roomMembers = roomMemberEntityFactory.buildList(3);
			await em.persistAndFlush(roomMembers);
			em.clear();

			await repo.delete(roomMembers);

			const deletedMembers = await Promise.all(
				roomMembers.map(async (member) => {
					const deletedMember = await em.findOne(RoomMemberEntity, member.id);
					expect(deletedMember).toBeNull();
					return deletedMember;
				})
			);
			expect(deletedMembers).toHaveLength(roomMembers.length);
		});
	});

	describe('findByRoomId', () => {
		const setup = async () => {
			const user = userFactory.buildWithId();
			const role = roleFactory.buildWithId({ name: RoleName.ROOM_EDITOR });
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [{ role, user }],
			});
			const roomMemberEntity = roomMemberEntityFactory.buildWithId({
				userGroup: userGroupEntity,
			});
			await em.persistAndFlush([user, userGroupEntity, roomMemberEntity]);
			em.clear();

			return { roomMemberEntity, userGroupEntity };
		};

		it('should find room member by roomId', async () => {
			const { roomMemberEntity, userGroupEntity } = await setup();

			const result = await repo.findByRoomId(roomMemberEntity.roomId.toString());

			expect(result).toBeDefined();
			expect(result?.id).toEqual(roomMemberEntity.id);
			expect(result?.userGroup?.id).toEqual(userGroupEntity.id);
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
			});
			const roomMemberEntities = roomMemberEntityFactory.buildList(3, {
				userGroup: userGroupEntity,
			});
			await em.persistAndFlush([user, userGroupEntity, ...roomMemberEntities]);
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
				expect(member.userGroup?.id).toEqual(userGroupEntity.id);
			});
		});

		it('should return empty array if no room members found', async () => {
			const nonExistentRoomIds = [new ObjectId().toString(), new ObjectId().toString()];
			const result = await repo.findByRoomIds(nonExistentRoomIds);

			expect(result).toEqual([]);
		});
	});
});
