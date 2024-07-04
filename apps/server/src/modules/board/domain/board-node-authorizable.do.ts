import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { AnyBoardNode } from './types';

export enum BoardRoles {
	EDITOR = 'editor',
	READER = 'reader',
}

export interface UserWithBoardRoles {
	firstName?: string;
	lastName?: string;
	roles: BoardRoles[];
	userId: EntityId;
}

export interface BoardNodeAuthorizableProps extends AuthorizableObject {
	id: EntityId;
	users: UserWithBoardRoles[];
	boardNode: AnyBoardNode;
	rootNode: AnyBoardNode;
	parentNode?: AnyBoardNode;
}

export class BoardNodeAuthorizable extends DomainObject<BoardNodeAuthorizableProps> {
	get users(): UserWithBoardRoles[] {
		return this.props.users;
	}

	get boardNode(): AnyBoardNode {
		return this.props.boardNode;
	}

	// TODO should we really be able to alter that? (check BoardNodeRule)
	set boardNode(boardNode: AnyBoardNode) {
		this.props.boardNode = boardNode;
	}

	get parentNode(): AnyBoardNode | undefined {
		return this.props.parentNode;
	}

	// TODO should we really be able to alter that? (check BoardNodeRule)
	set parentNode(boardNode: AnyBoardNode | undefined) {
		this.props.parentNode = boardNode;
	}

	get rootNode(): AnyBoardNode {
		return this.props.rootNode;
	}
}
