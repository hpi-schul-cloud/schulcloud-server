import { roleFactory } from '@shared/testing';
import { ObjectId } from 'bson';
import { RoomMember, RoomMemberProps } from './room-member.do';

describe('RoomMember', () => {
	describe('a new instance', () => {
		const setup = () => {
			const userId = new ObjectId();
			const roomMemberProps: RoomMemberProps = {
				id: '1',
				roomId: new ObjectId(),
				userGroupId: new ObjectId(),
				members: [{ userId, role: roleFactory.build() }],
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const roomMember = new RoomMember(roomMemberProps);
			return { roomMember, userId };
		};

		it('should have can set members', () => {
			const { roomMember } = setup();
			roomMember.members = [];

			expect(roomMember.members).toEqual([]);
		});

		it('should have can remove members', () => {
			const { roomMember, userId } = setup();
			roomMember.members = [];

			roomMember.removeMember(userId);

			expect(roomMember.members).toEqual([]);
		});
	});
});
