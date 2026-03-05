import { AuthorizableObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { RoomAuthorizable } from './room-authorizable.do';
import { RoomInvitationLink } from '@modules/room/domain/do/room-invitation-link.do';
import { RoomPublicApiConfig } from '@modules/room';

export class RoomInvitationLinkAuthorizable implements AuthorizableObject {
	public readonly id: EntityId = '';

	public readonly roomAuthorizable: RoomAuthorizable;

	public readonly roomInvitationLink: RoomInvitationLink;

	public readonly schoolName: string;

	constructor(
		roomAuthorizable: RoomAuthorizable,
		roomInvitationLink: RoomInvitationLink,
		schoolName: string,
		private readonly roomConfig: RoomPublicApiConfig
	) {
		this.schoolName = schoolName;
		this.roomAuthorizable = roomAuthorizable;
		this.roomInvitationLink = roomInvitationLink;
	}

	get schoolId(): EntityId {
		return this.roomAuthorizable.schoolId;
	}
	get config(): RoomPublicApiConfig {
		return this.roomConfig;
	}
}
