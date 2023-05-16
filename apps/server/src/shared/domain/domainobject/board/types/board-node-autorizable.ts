import { EntityId } from '@shared/domain/types';

export enum BoardRoles {
	EDITOR = 'editor',
	READER = 'reader',
}

export interface UserBoardRoles {
	roles: BoardRoles[];
	userId: EntityId;
}

export type BoardDoAuthorizable = {
	users: UserBoardRoles[];
	id: EntityId;
};
