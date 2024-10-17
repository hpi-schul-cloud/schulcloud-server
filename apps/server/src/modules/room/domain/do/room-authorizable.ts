import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { RoomMember } from '@src/modules/room-member';

export interface RoomAuthorizableProps extends AuthorizableObject {
	roomMembers: RoomMember[];
}

export class RoomAuthorizable extends DomainObject<RoomAuthorizableProps> {}
