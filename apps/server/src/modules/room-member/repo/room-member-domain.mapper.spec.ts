import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain/interface';
import { cleanupCollections, groupEntityFactory, roleFactory, userFactory } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@src/infra/database';
import { RoomMember } from '../do/room-member.do';
import { roomMemberEntityFactory } from '../testing';
import { RoomMemberEntity } from './entity';
import { RoomMemberDomainMapper } from './room-member-domain.mapper';

describe('RoomMemberDomainMapper', () => {
	let module: TestingModule;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [],
		}).compile();

		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('mapEntityToDo', () => {
		it('should map RoomMemberEntity to RoomMember domain object', () => {
			const user = userFactory.buildWithId();
			const role = roleFactory.buildWithId({ name: RoleName.ROOM_EDITOR });
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [{ role, user }],
			});

			const roomMemberEntity = roomMemberEntityFactory.buildWithId({ userGroupId: userGroupEntity.id });

			const result = RoomMemberDomainMapper.mapEntityToDo(roomMemberEntity, userGroupEntity.users);
			expect(result.id).toEqual(roomMemberEntity.id);
			expect(result.userGroupId.id).toEqual(roomMemberEntity.userGroupId.id);
			expect(result.members.length).toEqual(1);
			expect(result.members[0].userId.toHexString()).toEqual(user.id);
			expect(result.members[0].role.id).toEqual(role.id);
			expect(result.roomId).toEqual(roomMemberEntity.roomId);
		});

		it('should return existing domainObject if present', () => {
			const user = userFactory.build();
			const role = roleFactory.buildWithId({ name: RoleName.ROOM_EDITOR });
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [{ role, user }],
			});

			const roomMemberDo = new RoomMember({
				id: '1',
				roomId: new ObjectId(),
				userGroupId: new ObjectId(userGroupEntity.id),
				// eslint-disable-next-line @typescript-eslint/dot-notation
				members: RoomMemberDomainMapper['mapGroupUserEmbeddableToMembers'](userGroupEntity.users),
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-01-01'),
			});

			const roomMemberEntity = {
				id: '1',
				roomId: roomMemberDo.roomId,
				userGroupId: new ObjectId(userGroupEntity.id),
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-01-01'),
				domainObject: roomMemberDo,
			} as RoomMemberEntity;

			const result = RoomMemberDomainMapper.mapEntityToDo(roomMemberEntity, userGroupEntity.users);

			expect(result).toBe(roomMemberDo);
			expect(result).toBeInstanceOf(RoomMember);
			expect(result.getProps()).toEqual({
				id: '1',
				roomId: roomMemberDo.roomId,
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-01-01'),
				userGroupId: new ObjectId(userGroupEntity.id),
				members: roomMemberDo.members,
			});
		});
	});

	describe('mapDoToEntity', () => {
		const setup = () => {
			const user = userFactory.build();
			const role = roleFactory.buildWithId({ name: RoleName.ROOM_EDITOR });
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [{ role, user }],
			});
			const roomMemberEntity = roomMemberEntityFactory.buildWithId({ userGroupId: userGroupEntity.id });

			return { roomMemberEntity, userGroupEntity };
		};

		it('should convert them to an entity and return it', () => {
			const { userGroupEntity, roomMemberEntity } = setup();

			// eslint-disable-next-line @typescript-eslint/dot-notation
			const members = RoomMemberDomainMapper['mapGroupUserEmbeddableToMembers'](userGroupEntity.users);
			const roomMember = new RoomMember({ ...roomMemberEntity, members });
			const result = RoomMemberDomainMapper.mapDoToEntity(roomMember);

			expect(result).toBeInstanceOf(RoomMemberEntity);
			expect(result).toMatchObject(roomMemberEntity);
		});

		it('should return the entity', () => {
			const roomMemberEntity = roomMemberEntityFactory.buildWithId();
			const roomMember = new RoomMember({ ...roomMemberEntity, members: [] });
			const result = RoomMemberDomainMapper.mapDoToEntity(roomMember);
			expect(result.id).toEqual(roomMemberEntity.id);
			expect(result.roomId).toEqual(roomMemberEntity.roomId);
			expect(result.userGroupId).toEqual(roomMemberEntity.userGroupId);
			expect(result.createdAt).toEqual(roomMemberEntity.createdAt);
			expect(result.updatedAt).toEqual(roomMemberEntity.updatedAt);
		});
	});
});
