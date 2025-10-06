import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { AnyBoardNode } from './types';
import { Permission } from '@shared/domain/interface';
import { isColumnBoard } from './colum-board.do';

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
	schoolId?: EntityId;
	boardContextSettings: BoardContextSettings;
}

export interface BoardContextSettings {
	canRoomEditorManageVideoconference?: boolean;
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

	get schoolId(): EntityId | undefined {
		return this.props.schoolId;
	}

	get boardContextSettings(): BoardContextSettings {
		return this.props.boardContextSettings;
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
			];
		}

		if (user?.roles.includes(BoardRoles.EDITOR)) {
			const permissions: Permission[] = [Permission.BOARD_VIEW, Permission.BOARD_EDIT, Permission.BOARD_MANAGE];
			const canRoomEditorManageVideoconference = this.boardContextSettings.canRoomEditorManageVideoconference ?? false;
			if (canRoomEditorManageVideoconference) {
				permissions.push(Permission.BOARD_MANAGE_VIDEOCONFERENCE);
			}
			return permissions;
		}

		if (user?.roles.includes(BoardRoles.READER)) {
			const permissions = [Permission.BOARD_VIEW];
			if (this.readersCanEdit(this.rootNode)) {
				permissions.push(Permission.BOARD_EDIT);
			}
			return permissions;
		}

		return [];
	}

	private readersCanEdit(rootNode: AnyBoardNode): boolean {
		return isColumnBoard(rootNode) && rootNode.readersCanEdit;
	}
}
