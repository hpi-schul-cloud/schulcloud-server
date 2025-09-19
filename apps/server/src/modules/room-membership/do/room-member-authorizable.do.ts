import { AuthorizableObject } from '@shared/domain/domain-object';
import { RoomMember } from './room-member.do';
import { RoomMembershipAuthorizable } from './room-membership-authorizable.do';
import { EntityId } from '@shared/domain/types';

export class RoomMemberAuthorizable implements AuthorizableObject {
	public readonly id: EntityId = '';

	public readonly roomMembershipAuthorizable: RoomMembershipAuthorizable;

	public readonly member: RoomMember;

	constructor(roomMembershipAuthorizable: RoomMembershipAuthorizable, member: RoomMember) {
		this.roomMembershipAuthorizable = roomMembershipAuthorizable;
		this.member = member;
	}
}
