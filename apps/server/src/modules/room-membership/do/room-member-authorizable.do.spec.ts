import { RoleName } from '@modules/role';
import { RoomAuthorizable } from './room-authorizable.do';
import { RoomMemberAuthorizable } from './room-member-authorizable.do';
import { RoomMember } from './room-member.do';

describe('RoomMemberAuthorizable', () => {
	const setup = () => {
		const roomAuthorizable = new RoomAuthorizable('roomId', [], 'schoolId');
		const roomMember = new RoomMember({
			userId: 'userId',
			firstName: 'firstName',
			lastName: 'lastName',
			roomRoleId: 'roomRoleId',
			roomRoleName: RoleName.STUDENT,
			schoolId: 'otherSchoolId',
			schoolRoleNames: [RoleName.STUDENT],
		});
		const roomMemberAuthorizable = new RoomMemberAuthorizable(roomAuthorizable, roomMember);
		return { roomMemberAuthorizable };
	};

	it('should get schoolId', () => {
		const { roomMemberAuthorizable } = setup();
		expect(roomMemberAuthorizable.schoolId).toEqual('schoolId');
	});
});
