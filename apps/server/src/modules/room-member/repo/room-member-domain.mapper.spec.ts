import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain/interface';
import { cleanupCollections, groupEntityFactory, roleFactory, userFactory } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@src/infra/database';
import { RoomMember, RoomMemberProps } from '../do/room-member.do';
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
			const user = userFactory.build();
			const role = roleFactory.buildWithId({ name: RoleName.ROOM_EDITOR });
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [{ role, user }],
			});
			const roomMemberEntity = roomMemberEntityFactory.build({ userGroup: userGroupEntity });

			const result = RoomMemberDomainMapper.mapEntityToDo(roomMemberEntity);
			expect(result.id).toEqual(roomMemberEntity.id);
			expect(result.userGroup.id).toEqual(roomMemberEntity.userGroup.id);
			expect(result.userGroup.users[0].role.id).toEqual(roomMemberEntity.userGroup.users[0].role.id);
			expect(result.userGroup.users[0].user.id).toEqual(roomMemberEntity.userGroup.users[0].user.id);
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
				userGroup: userGroupEntity,
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-01-01'),
			});

			const roomMemberEntity = {
				id: '1',
				roomId: roomMemberDo.roomId,
				userGroup: userGroupEntity,
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-01-01'),
				domainObject: roomMemberDo,
			} as RoomMemberEntity;

			const result = RoomMemberDomainMapper.mapEntityToDo(roomMemberEntity);

			expect(result).toBe(roomMemberDo);
			expect(result).toBeInstanceOf(RoomMember);
			expect(result.getProps()).toEqual({
				id: '1',
				roomId: roomMemberDo.roomId,
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-01-01'),
				userGroup: userGroupEntity,
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
			const roomMemberEntity = roomMemberEntityFactory.build({ userGroup: userGroupEntity });

			return { roomMemberEntity, userGroupEntity };
		};

		describe('when domain object props are instanceof RoomMemberEntity', () => {
			it('should return the entity', () => {
				const { roomMemberEntity } = setup();

				const roomMember = new RoomMember(roomMemberEntity);

				const result = RoomMemberDomainMapper.mapDoToEntity(roomMember);

				expect(result).toBe(roomMemberEntity);
			});
		});

		describe('when domain object props are not instanceof RoomMemberEntity', () => {
			it('should convert them to an entity and return it', () => {
				const { userGroupEntity } = setup();

				const roomMemberEntity: RoomMemberProps = {
					id: '66d581c3ef74c548a4efea1d',
					roomId: new ObjectId(),
					userGroup: userGroupEntity,
					createdAt: new Date('2023-01-01'),
					updatedAt: new Date('2023-01-01'),
				};
				const roomMember = new RoomMember(roomMemberEntity);

				const result = RoomMemberDomainMapper.mapDoToEntity(roomMember);

				expect(result).toBeInstanceOf(RoomMemberEntity);
				expect(result).toMatchObject(roomMemberEntity);
			});
		});
	});
});
