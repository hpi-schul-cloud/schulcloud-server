import { groupEntityFactory, roleFactory, userFactory } from '@shared/testing';
import { RoleName } from '@shared/domain/interface';
import { RoomMember } from '../do/room-member.do';
import { roomMemberEntityFactory } from '../testing';
import { RoomMemberDomainMapper } from './room-member-domain.mapper';

// TODO: fix this test
describe('RoomMemberDomainMapper', () => {
	describe('mapEntityToDo', () => {
		const setup = () => {
			console.log('----')
			const user = userFactory.build();
			console.log('user', user);
			const role = roleFactory.buildWithId({ name: RoleName.ROOM_EDITOR });
			console.log('role', role);
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [{ role, user }],
			});
			const roomMemberEntity = roomMemberEntityFactory.buildWithId({ userGroup: userGroupEntity });

			return { roomMemberEntity, userGroupEntity };
		};

		it('should map RoomMemberEntity to RoomMember domain object', () => {
			const { roomMemberEntity } = setup();
			const result = RoomMemberDomainMapper.mapEntityToDo(roomMemberEntity);

			expect(result).toBeInstanceOf(RoomMember);
			expect(result.getProps()).toEqual({
				id: '1',
				userId: 'user1',
				roomId: 'room1',
				role: 'ROOM_VIEWER',
			});
		});

		// it('should return existing domainObject if present', () => {
		// 	const existingRoomMember = new RoomMember({
		// 		id: '1',
		// 		userId: 'user1',
		// 		roomId: 'room1',
		// 		role: 'ROOM_VIEWER',
		// 	});

		// 	const roomMemberEntity = {
		// 		id: '2',
		// 		userId: 'user2',
		// 		roomId: 'room2',
		// 		role: 'ROOM_EDITOR',
		// 		domainObject: existingRoomMember,
		// 	} as RoomMemberEntity;

		// 	const result = RoomMemberDomainMapper.mapEntityToDo(roomMemberEntity);

		// 	expect(result).toBe(existingRoomMember);
		// 	expect(result.getProps()).toEqual({
		// 		id: '1',
		// 		userId: 'user1',
		// 		roomId: 'room1',
		// 		role: 'ROOM_VIEWER',
		// 	});
		// });
	});

	// describe('mapDoToEntity', () => {
	// 	it('should return entity when props are instanceof RoomMemberEntity', () => {
	// 		const roomMemberEntity = new RoomMemberEntity();
	// 		roomMemberEntity.id = '1';
	// 		roomMemberEntity.userId = 'user1';
	// 		roomMemberEntity.roomId = 'room1';
	// 		roomMemberEntity.role = 'ROOM_VIEWER';

	// 		const roomMember = new RoomMember(roomMemberEntity);

	// 		const result = RoomMemberDomainMapper.mapDoToEntity(roomMember);

	// 		expect(result).toBe(roomMemberEntity);
	// 	});

	// 	it('should convert props to entity when not instanceof RoomMemberEntity', () => {
	// 		const roomMemberProps = {
	// 			id: '1',
	// 			userId: 'user1',
	// 			roomId: 'room1',
	// 			role: 'ROOM_VIEWER',
	// 		};
	// 		const roomMember = new RoomMember(roomMemberProps);

	// 		const result = RoomMemberDomainMapper.mapDoToEntity(roomMember);

	// 		expect(result).toBeInstanceOf(RoomMemberEntity);
	// 		expect(result).toMatchObject(roomMemberProps);
	// 	});
	// });
});
