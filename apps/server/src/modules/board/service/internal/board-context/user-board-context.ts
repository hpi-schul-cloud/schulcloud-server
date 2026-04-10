import { EntityId } from '@shared/domain/types';
import {
	BoardConfiguration,
	BoardExternalReferenceType,
	BoardRoles,
	ColumnBoard,
	MediaBoard,
	UserWithBoardRoles,
} from '../../../domain';
import { PreparedBoardContext } from './prepared-board-context.interface';

/**
 * Prepared context for User-based boards (personal boards).
 * The user is the sole owner with editor and admin roles.
 */
export class UserBoardContext implements PreparedBoardContext {
	public readonly type = BoardExternalReferenceType.User;

	private readonly usersWithBoardRoles: UserWithBoardRoles[];

	constructor(userId: EntityId) {
		this.usersWithBoardRoles = [
			{
				userId,
				roles: [BoardRoles.EDITOR, BoardRoles.ADMIN],
			},
		];
	}

	public getUsersWithBoardRoles(): UserWithBoardRoles[] {
		return this.usersWithBoardRoles;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getBoardConfiguration(_rootNode: MediaBoard | ColumnBoard): BoardConfiguration {
		return {
			canEditorsManageVideoconference: false,
			canReadersEdit: false,
			canAdminsToggleReadersCanEdit: false,
			isLocked: false,
		};
	}
}
