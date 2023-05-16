import { EntityId } from '@shared/domain/types';
import { BaseDO } from '../../base.do';

export enum BoardRoles {
	EDITOR = 'editor',
	READER = 'reader',
}

export interface UserBoardRoles {
	roles: BoardRoles[];
	userId: EntityId;
}

export class BoardDoAuthorizable extends BaseDO {
	users: UserBoardRoles[];
	id: EntityId;

	constructor(users: UserBoardRoles[], id: EntityId) {
		super(id);
		this.users = users;
		this.id = id;
	}
}
