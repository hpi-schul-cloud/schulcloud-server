/**
 * PERMISSION MATRIX APPROACH
 *
 * This approach centralizes all permission mappings in a declarative matrix/map.
 * Each domain action is mapped to its required permission check.
 */

import { Permission } from '@shared/domain/interface';
import { User } from '@modules/user/repo';
import { BoardNodeAuthorizable, ColumnBoard, MediaBoard, SubmissionItem } from '../../domain';

// Define all possible board actions as a union type
export type BoardAction =
	// Card actions
	| 'COPY_CARD'
	| 'CREATE_CARD'
	| 'DELETE_CARD'
	| 'MOVE_CARD'
	| 'UPDATE_CARD_HEIGHT'
	| 'UPDATE_CARD_TITLE'
	| 'FIND_CARDS'
	// Column actions
	| 'CREATE_COLUMN'
	| 'DELETE_COLUMN'
	| 'MOVE_COLUMN'
	| 'UPDATE_COLUMN_TITLE'
	// Element actions
	| 'CREATE_ELEMENT'
	| 'DELETE_ELEMENT'
	| 'MOVE_ELEMENT'
	| 'UPDATE_ELEMENT'
	| 'VIEW_ELEMENT'
	// Board actions
	| 'FIND_BOARD'
	| 'COPY_BOARD'
	| 'DELETE_BOARD'
	| 'UPDATE_BOARD_TITLE'
	| 'UPDATE_BOARD_VISIBILITY'
	| 'UPDATE_BOARD_LAYOUT'
	// Media board actions
	| 'VIEW_MEDIA_BOARD'
	| 'CREATE_MEDIA_BOARD_LINE'
	| 'DELETE_MEDIA_BOARD_LINE'
	| 'UPDATE_MEDIA_BOARD_LINE'
	| 'UPDATE_MEDIA_BOARD_COLOR'
	| 'UPDATE_MEDIA_BOARD_LAYOUT'
	| 'COLLAPSE_MEDIA_BOARD'
	// Submission actions
	| 'CREATE_SUBMISSION_ITEM_CONTENT'
	| 'DELETE_SUBMISSION_ITEM'
	| 'UPDATE_SUBMISSION_ITEM'
	// Special actions
	| 'UPDATE_READERS_CAN_EDIT_SETTING'
	| 'RELOCATE_CONTENT';

// Define permission check types
export type PermissionCheckType =
	| 'EDIT_BOARD'
	| 'MANAGE_BOARD'
	| 'VIEW_BOARD'
	| 'SUBMISSION_ITEM_OWNER'
	| 'MANAGE_READERS_CAN_EDIT'
	| 'RELOCATE_CONTENT';

// The Permission Matrix: Maps each action to its required permission check
export const BOARD_PERMISSION_MATRIX: Record<BoardAction, PermissionCheckType> = {
	// Card actions -> EDIT_BOARD
	COPY_CARD: 'EDIT_BOARD',
	CREATE_CARD: 'EDIT_BOARD',
	DELETE_CARD: 'EDIT_BOARD',
	MOVE_CARD: 'EDIT_BOARD',
	UPDATE_CARD_HEIGHT: 'EDIT_BOARD',
	UPDATE_CARD_TITLE: 'EDIT_BOARD',
	FIND_CARDS: 'VIEW_BOARD',

	// Column actions -> EDIT_BOARD
	CREATE_COLUMN: 'EDIT_BOARD',
	DELETE_COLUMN: 'EDIT_BOARD',
	MOVE_COLUMN: 'EDIT_BOARD',
	UPDATE_COLUMN_TITLE: 'EDIT_BOARD',

	// Element actions -> EDIT_BOARD (except VIEW)
	CREATE_ELEMENT: 'EDIT_BOARD',
	DELETE_ELEMENT: 'EDIT_BOARD',
	MOVE_ELEMENT: 'EDIT_BOARD',
	UPDATE_ELEMENT: 'EDIT_BOARD',
	VIEW_ELEMENT: 'VIEW_BOARD',

	// Board actions -> mixed
	FIND_BOARD: 'VIEW_BOARD',
	COPY_BOARD: 'MANAGE_BOARD',
	DELETE_BOARD: 'MANAGE_BOARD',
	UPDATE_BOARD_TITLE: 'EDIT_BOARD',
	UPDATE_BOARD_VISIBILITY: 'MANAGE_BOARD',
	UPDATE_BOARD_LAYOUT: 'MANAGE_BOARD',

	// Media board actions -> EDIT_BOARD
	VIEW_MEDIA_BOARD: 'VIEW_BOARD',
	CREATE_MEDIA_BOARD_LINE: 'EDIT_BOARD',
	DELETE_MEDIA_BOARD_LINE: 'EDIT_BOARD',
	UPDATE_MEDIA_BOARD_LINE: 'EDIT_BOARD',
	UPDATE_MEDIA_BOARD_COLOR: 'EDIT_BOARD',
	UPDATE_MEDIA_BOARD_LAYOUT: 'EDIT_BOARD',
	COLLAPSE_MEDIA_BOARD: 'EDIT_BOARD',

	// Submission actions -> SUBMISSION_ITEM_OWNER
	CREATE_SUBMISSION_ITEM_CONTENT: 'SUBMISSION_ITEM_OWNER',
	DELETE_SUBMISSION_ITEM: 'SUBMISSION_ITEM_OWNER',
	UPDATE_SUBMISSION_ITEM: 'SUBMISSION_ITEM_OWNER',

	// Special actions
	UPDATE_READERS_CAN_EDIT_SETTING: 'MANAGE_READERS_CAN_EDIT',
	RELOCATE_CONTENT: 'RELOCATE_CONTENT',
};

/**
 * BoardPermissionService using the Permission Matrix
 */
export class BoardPermissionMatrixService {
	/**
	 * Single entry point for all permission checks
	 */
	public can(action: BoardAction, user: User, authorizable: BoardNodeAuthorizable): boolean {
		const requiredCheck = BOARD_PERMISSION_MATRIX[action];
		return this.executePermissionCheck(requiredCheck, user, authorizable);
	}

	private executePermissionCheck(
		checkType: PermissionCheckType,
		user: User,
		authorizable: BoardNodeAuthorizable
	): boolean {
		const permissions = authorizable.getUserPermissions(user.id);
		const isBoard = authorizable.rootNode instanceof ColumnBoard || authorizable.rootNode instanceof MediaBoard;

		switch (checkType) {
			case 'EDIT_BOARD':
				return isBoard && permissions.includes(Permission.BOARD_EDIT);

			case 'MANAGE_BOARD':
				return isBoard && permissions.includes(Permission.BOARD_MANAGE);

			case 'VIEW_BOARD':
				return isBoard && permissions.includes(Permission.BOARD_VIEW);

			case 'SUBMISSION_ITEM_OWNER':
				return this.isSubmissionItemOfUser(user, authorizable);

			case 'MANAGE_READERS_CAN_EDIT':
				return (
					authorizable.boardNode instanceof ColumnBoard &&
					permissions.includes(Permission.BOARD_MANAGE_READERS_CAN_EDIT)
				);

			case 'RELOCATE_CONTENT':
				return isBoard && permissions.includes(Permission.BOARD_RELOCATE_CONTENT);

			default:
				return false;
		}
	}

	private isSubmissionItemOfUser(user: User, authorizable: BoardNodeAuthorizable): boolean {
		const { boardNode } = authorizable;
		return boardNode instanceof SubmissionItem && boardNode.userId === user.id;
	}
}

/**
 * USAGE EXAMPLE:
 *
 * const permissionService = new BoardPermissionMatrixService();
 *
 * // Instead of: rule.canCopyCard(user, authorizable)
 * // You use:    permissionService.can('COPY_CARD', user, authorizable)
 *
 * // Instead of: rule.canDeleteBoard(user, authorizable)
 * // You use:    permissionService.can('DELETE_BOARD', user, authorizable)
 */

