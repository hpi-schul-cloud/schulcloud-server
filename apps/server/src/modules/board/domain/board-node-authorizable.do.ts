import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { AnyBoardNode } from './types';

export enum BoardRoles {
	EDITOR = 'editor',
	READER = 'reader',
	ADMIN = 'admin',
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
	boardConfiguration: BoardConfiguration;
}

export interface BoardConfiguration {
	canEditorsManageVideoconference?: boolean;
	canReadersEdit?: boolean;
	canAdminsToggleReadersCanEdit?: boolean;
	isLocked?: boolean;
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

	get boardConfiguration(): BoardConfiguration {
		return this.props.boardConfiguration;
	}

	public getUserPermissions(userId: EntityId): Permission[] {
		const user = this.users.find((user) => user.userId === userId);
		if (user?.roles.includes(BoardRoles.ADMIN)) {
			return [
				Permission.BOARD_VIEW,
				Permission.BOARD_EDIT,
				Permission.BOARD_MANAGE_VIDEOCONFERENCE,
				Permission.BOARD_MANAGE_READERS_CAN_EDIT,
				Permission.BOARD_MANAGE,
				Permission.BOARD_SHARE_BOARD,
				Permission.BOARD_RELOCATE_CONTENT,
			];
		}

		if (user?.roles.includes(BoardRoles.EDITOR)) {
			return [Permission.BOARD_VIEW, Permission.BOARD_EDIT, Permission.BOARD_MANAGE];
		}

		if (user?.roles.includes(BoardRoles.READER)) {
			const permissions = [Permission.BOARD_VIEW];
			return permissions;
		}

		return [];
	}
}
