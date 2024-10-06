import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain/interface';
import { cleanupCollections, groupEntityFactory, roleFactory, userFactory } from '@shared/testing';
import { RoomMemberRepo } from './room-member.repo';
import { roomMemberEntityFactory } from '../testing';
import { RoomMemberEntity } from './entity/room-member.entity';

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
		it('should save a single room member', async () => {
			const roomMember = roomMemberEntityFactory.build();

			await repo.save(roomMember);

			const savedMember = await em.findOne(RoomMemberEntity, roomMember.id);
			expect(savedMember).toBeDefined();
			expect(savedMember?.id).toEqual(roomMember.id);
		});

		it('should save multiple room members', async () => {
			const roomMembers = roomMemberEntityFactory.buildList(3);

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
});
