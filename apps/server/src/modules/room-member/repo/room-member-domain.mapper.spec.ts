import { RoomMember, RoomMemberProps } from '../do/room-member.do';
import { roomMemberEntityFactory } from '../testing';
import { RoomMemberEntity } from './entity';
import { RoomMemberDomainMapper } from './room-member-domain.mapper';

describe('RoomMemberDomainMapper', () => {
	describe('mapEntityToDo', () => {
		it('should correctly map roomMemberEntity to RoomMember domain object', () => {
			const roomMemberEntity = {
				id: '1',
			} as RoomMemberEntity;

			const result = RoomMemberDomainMapper.mapEntityToDo(roomMemberEntity);

			expect(result).toBeInstanceOf(RoomMember);
			expect(result.getProps()).toEqual({
				id: '1',
			});
		});

		it('should return existing domainObject if present, regardless of entity properties', () => {
			const existingRoomMember = new RoomMember({
				id: '1',
				roomId: 'r1',
				userGroupId: 'ug1',
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-01-01'),
			});

			const roomMemberEntity = {
				id: '1',
				domainObject: existingRoomMember,
			} as RoomMemberEntity;

			const result = RoomMemberDomainMapper.mapEntityToDo(roomMemberEntity);

			expect(result).toBe(existingRoomMember);
			expect(result).toBeInstanceOf(RoomMember);
			expect(result.getProps()).toEqual({
				id: '1',
				roomId: 'r1',
				userGroupId: 'ug1',
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date('2023-01-01'),
			});
			expect(result.getProps().id).toBe('1');
			expect(result.getProps().id).toBe(roomMemberEntity.id);
		});

		it('should wrap the actual entity reference in the domain object', () => {
			const roomMemberEntity = {
				id: '1',
			} as RoomMemberEntity;

			const result = RoomMemberDomainMapper.mapEntityToDo(roomMemberEntity);
			// @ts-expect-error check necessary
			const { props } = result;

			expect(props === roomMemberEntity).toBe(true);
		});
	});

	describe('mapDoToEntity', () => {
		describe('when domain object props are instanceof roomMemberEntity', () => {
			it('should return the entity', () => {
				const roomMemberEntity = roomMemberEntityFactory.build();
				const roomMember = new RoomMember(roomMemberEntity);

				const result = RoomMemberDomainMapper.mapDoToEntity(roomMember);

				expect(result).toBe(roomMemberEntity);
			});
		});

		describe('when domain object props are not instanceof roomMemberEntity', () => {
			it('should convert them to an entity and return it', () => {
				const roomMemberEntity: RoomMemberProps = {
					id: '66d581c3ef74c548a4efea1d',
					roomId: '66d581c3ef74c548a4efea1a',
					userGroupId: '66d581c3ef74c548a4efea1b',
					createdAt: new Date('2024-10-1'),
					updatedAt: new Date('2024-10-1'),
				};
				const room = new RoomMember(roomMemberEntity);

				const result = RoomMemberDomainMapper.mapDoToEntity(room);

				expect(result).toBeInstanceOf(RoomMemberEntity);
				expect(result).toMatchObject(roomMemberEntity);
			});
		});
	});
});
