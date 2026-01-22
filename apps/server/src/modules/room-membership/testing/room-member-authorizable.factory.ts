import { RoleName } from '@modules/role';
import { RoomMemberAuthorizable } from '../do/room-member-authorizable.do';
import { RoomMember } from '../do/room-member.do';
import { RoomMembershipAuthorizable } from '../do/room-membership-authorizable.do';

type MinimalUser = {
	id: string;
	firstName?: string;
	lastName?: string;
	school: { id: string };
	roles: { getItems: () => Array<{ name: RoleName }> };
};

/**
 * Build a `RoomMemberAuthorizable` from a `RoomMembershipAuthorizable` and a target `User`.
 * Derives the `RoomMember` data from the membership's member list and the provided user.
 */
export function buildRoomMemberAuthorizable(
	roomMembershipAuthorizable: RoomMembershipAuthorizable,
	user: MinimalUser
): RoomMemberAuthorizable {
	const memberEntry = roomMembershipAuthorizable.members.find((m) => m.userId === user.id);
	if (!memberEntry) {
		throw new Error('User not found in room membership');
	}

	const primaryRole = memberEntry.roles[0];

	const roomMember = new RoomMember({
		userId: user.id,
		firstName: user.firstName ?? '',
		lastName: user.lastName ?? '',
		roomRoleId: primaryRole?.id ?? '',
		roomRoleName: primaryRole?.name ?? RoleName.ROOMVIEWER,
		schoolId: memberEntry.userSchoolId ?? roomMembershipAuthorizable.schoolId,
		schoolRoleNames: user.roles.getItems().map((r) => r.name),
	});

	return new RoomMemberAuthorizable(roomMembershipAuthorizable, roomMember);
}
