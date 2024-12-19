import { RoomMembership, RoomMembershipProps } from '../do/room-membership.do';
import { roomMembershipEntityFactory } from '../testing';
import { RoomMembershipEntity } from './entity';
import { RoomMembershipDomainMapper } from './room-membership-domain.mapper';

describe('RoomMembershipDomainMapper', () => {
	describe('mapEntityToDo', () => {
		it('should correctly map roomMembershipEntity to RoomMembership domain object', () => {
			const roomMembershipEntity = {
				id: '1',
			} as RoomMembershipEntity;

			const result = RoomMembershipDomainMapper.mapEntityToDo(roomMembershipEntity);

			expect(result).toBeInstanceOf(RoomMembership);
			expect(result.getProps()).toEqual({
				id: '1',
			});
		});

		it('should return existing domainObject if present, regardless of entity properties', () => {
			const existingRoomMembership = new RoomMembership({
				id: '1',
				roomId: 'r1',
				userGroupId: 'ug1',
				schoolId: 's1',
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-01-01'),
			});

			const roomMembershipEntity = {
				id: '1',
				domainObject: existingRoomMembership,
			} as RoomMembershipEntity;

			const result = RoomMembershipDomainMapper.mapEntityToDo(roomMembershipEntity);

			expect(result).toBe(existingRoomMembership);
			expect(result).toBeInstanceOf(RoomMembership);
			expect(result.getProps()).toEqual({
				id: '1',
				roomId: 'r1',
				userGroupId: 'ug1',
				schoolId: 's1',
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-01-01'),
			});
			expect(result.getProps().id).toBe('1');
			expect(result.getProps().id).toBe(roomMembershipEntity.id);
		});

		it('should wrap the actual entity reference in the domain object', () => {
			const roomMembershipEntity = {
				id: '1',
			} as RoomMembershipEntity;

			const result = RoomMembershipDomainMapper.mapEntityToDo(roomMembershipEntity);
			// @ts-expect-error check necessary
			const { props } = result;

			expect(props === roomMembershipEntity).toBe(true);
		});
	});

	describe('mapDoToEntity', () => {
		describe('when domain object props are instanceof roomMembershipEntity', () => {
			it('should return the entity', () => {
				const roomMembershipEntity = roomMembershipEntityFactory.build();
				const roomMembership = new RoomMembership(roomMembershipEntity);

				const result = RoomMembershipDomainMapper.mapDoToEntity(roomMembership);

				expect(result).toBe(roomMembershipEntity);
			});
		});

		describe('when domain object props are not instanceof roomMembershipEntity', () => {
			it('should convert them to an entity and return it', () => {
				const roomMembershipEntity: RoomMembershipProps = {
					id: '66d581c3ef74c548a4efea1d',
					roomId: '66d581c3ef74c548a4efea1a',
					userGroupId: '66d581c3ef74c548a4efea1b',
					schoolId: '66d581c3ef74c548a4efea1c',
					createdAt: new Date('2024-10-1'),
					updatedAt: new Date('2024-10-1'),
				};
				const room = new RoomMembership(roomMembershipEntity);

				const result = RoomMembershipDomainMapper.mapDoToEntity(room);

				expect(result).toBeInstanceOf(RoomMembershipEntity);
				expect(result).toMatchObject(roomMembershipEntity);
			});
		});
	});
});
