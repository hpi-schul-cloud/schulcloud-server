import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain/interface';
import { cleanupCollections, groupEntityFactory, roleFactory, userFactory } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@src/infra/database';
import { RoomMember } from '../do/room-member.do';
import { roomMemberEntityFactory } from '../testing';
import { RoomMemberDomainMapper } from './room-member-domain.mapper';

// TODO: fix this test
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
		const setup = () => {
			const user = userFactory.build();
			const role = roleFactory.buildWithId({ name: RoleName.ROOM_EDITOR });
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [{ role, user }],
			});
			const roomMemberEntity = roomMemberEntityFactory.build({ userGroup: userGroupEntity });

			return { roomMemberEntity, userGroupEntity };
		};

		it('should map RoomMemberEntity to RoomMember domain object', () => {
			const { roomMemberEntity } = setup();
			const result = RoomMemberDomainMapper.mapEntityToDo(roomMemberEntity);
			// NOTE: result.getProps().id === undefined, I don't know why
			expect(result.id).toEqual(roomMemberEntity.id);
			expect(result.getProps().userGroup.id).toEqual(roomMemberEntity.userGroup.id);
			expect(result.getProps().userGroup.users[0].role.id).toEqual(roomMemberEntity.userGroup.users[0].role.id);
			expect(result.getProps().userGroup.users[0].user.id).toEqual(roomMemberEntity.userGroup.users[0].user.id);
			expect(result.getProps().roomId).toEqual(roomMemberEntity.roomId);
		});

		// NOTE: something missing with the domain object
		// it('should return existing domainObject if present', () => {
		// 	const { roomMemberEntity } = setup();

		// 	const result = RoomMemberDomainMapper.mapEntityToDo(roomMemberEntity);

		// 	// expect(result).toBe(existingRoomMember);
		// 	expect(result.getProps()).toEqual({
		// 		id: '1',
		// 		userId: 'user1',
		// 		roomId: 'room1',
		// 		role: 'ROOM_VIEWER',
		// 	});
		// });
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

		it('should return entity when props are instanceof RoomMemberEntity', () => {
			const { roomMemberEntity } = setup();

			const roomMember = new RoomMember(roomMemberEntity);

			const result = RoomMemberDomainMapper.mapDoToEntity(roomMember);

			expect(result).toBe(roomMemberEntity);
		});
	});
});
