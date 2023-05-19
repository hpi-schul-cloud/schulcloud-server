import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export enum BoardRoles {
	EDITOR = 'editor',
	READER = 'reader',
}

export interface UserBoardRoles {
	roles: BoardRoles[];
	userId: EntityId;
}

export interface BoardDoAuthorizableProps extends AuthorizableObject {
	id: EntityId;
	users: UserBoardRoles[];
}

export class BoardDoAuthorizable extends DomainObject<BoardDoAuthorizableProps> {
	get users(): UserBoardRoles[] {
		return this.props.users;
	}
}
