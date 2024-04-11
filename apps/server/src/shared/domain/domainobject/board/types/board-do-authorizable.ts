import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { ColumnBoard } from '../column-board.do';
import { MediaBoard } from '../media-board';
import { AnyBoardDo } from './any-board-do';

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

export interface BoardDoAuthorizableProps extends AuthorizableObject {
	id: EntityId;
	users: UserWithBoardRoles[];
	boardDo: AnyBoardDo;
	rootDo: ColumnBoard | MediaBoard;
	parentDo?: AnyBoardDo;
}

export class BoardDoAuthorizable extends DomainObject<BoardDoAuthorizableProps> {
	get users(): UserWithBoardRoles[] {
		return this.props.users;
	}

	get boardDo(): AnyBoardDo {
		return this.props.boardDo;
	}

	set boardDo(value: AnyBoardDo) {
		this.props.boardDo = value;
	}

	get parentDo(): AnyBoardDo | undefined {
		return this.props.parentDo;
	}

	set parentDo(value: AnyBoardDo | undefined) {
		this.props.parentDo = value;
	}

	get rootDo(): ColumnBoard | MediaBoard {
		return this.props.rootDo;
	}
}
