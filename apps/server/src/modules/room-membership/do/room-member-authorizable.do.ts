import { type AuthorizableObject } from '@shared/domain/domain-object';
import { type EntityId } from '@shared/domain/types';
import { type RoomAuthorizable } from './room-authorizable.do';
import { type RoomMember } from './room-member.do';

export class RoomMemberAuthorizable implements AuthorizableObject {
	public readonly id: EntityId = '';

	public readonly roomAuthorizable: RoomAuthorizable;

	public readonly member: RoomMember;

	constructor(roomAuthorizable: RoomAuthorizable, member: RoomMember) {
		this.roomAuthorizable = roomAuthorizable;
		this.member = member;
	}

	get schoolId(): EntityId {
		return this.roomAuthorizable.schoolId;
	}
}
