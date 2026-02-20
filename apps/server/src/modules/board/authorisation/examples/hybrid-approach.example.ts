/**
 * HYBRID APPROACH: Combining Permission Matrix with Domain-Specific Methods
 *
 * This is a practical refactoring of the original board-node.rule.ts
 * that keeps the semantic method names (DDD) but eliminates code duplication.
 */

import { Action, AuthorizationContext, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { Permission } from '@shared/domain/interface';
import { User } from '@modules/user/repo';
import { BoardNodeAuthorizable, ColumnBoard, MediaBoard, SubmissionItem } from '../../domain';

// ============================================================================
// PERMISSION CHECK TYPES
// ============================================================================

type PermissionCheckType =
	| 'EDIT'
	| 'MANAGE'
	| 'VIEW'
	| 'SUBMISSION_OWNER'
	| 'MANAGE_READERS_CAN_EDIT'
	| 'RELOCATE_CONTENT';

// ============================================================================
// REFACTORED RULE (Hybrid Approach)
// ============================================================================

export class BoardNodeRuleRefactored implements Rule<BoardNodeAuthorizable> {

	// -------------------------------------------------------------------------
	// Permission Matrix: Single source of truth for action -> check mapping
	// -------------------------------------------------------------------------

	private readonly permissionMatrix: Record<string, PermissionCheckType> = {
		// Card actions
		copyCard: 'EDIT',
		createCard: 'EDIT',
		deleteCard: 'EDIT',
		moveCard: 'EDIT',
		updateCardHeight: 'EDIT',
		updateCardTitle: 'EDIT',
		findCards: 'VIEW',

		// Column actions
		createColumn: 'EDIT',
		deleteColumn: 'EDIT',
		moveColumn: 'EDIT',
		updateColumnTitle: 'EDIT',

		// Element actions
		createElement: 'EDIT',
		deleteElement: 'EDIT',
		moveElement: 'EDIT',
		updateElement: 'EDIT',
		viewElement: 'VIEW',

		// Board actions
		findBoard: 'VIEW',
		copyBoard: 'MANAGE',
		deleteBoard: 'MANAGE',
		updateBoardTitle: 'EDIT',
		updateBoardVisibility: 'MANAGE',
		updateBoardLayout: 'MANAGE',

		// Media board actions
		viewMediaBoard: 'VIEW',
		createMediaBoardLine: 'EDIT',
		deleteMediaBoardLine: 'EDIT',
		updateMediaBoardLine: 'EDIT',
		updateMediaBoardColor: 'EDIT',
		updateMediaBoardLayout: 'EDIT',
		collapseMediaBoard: 'EDIT',

		// Submission actions
		createSubmissionItemContent: 'SUBMISSION_OWNER',
		deleteSubmissionItem: 'SUBMISSION_OWNER',
		updateSubmissionItem: 'SUBMISSION_OWNER',

		// Special actions
		updateReadersCanEditSetting: 'MANAGE_READERS_CAN_EDIT',
		relocateContent: 'RELOCATE_CONTENT',
	};

	// -------------------------------------------------------------------------
	// Core Permission Check Logic (single implementation)
	// -------------------------------------------------------------------------

	private checkPermission(
		checkType: PermissionCheckType,
		user: User,
		authorizable: BoardNodeAuthorizable
	): boolean {
		const permissions = authorizable.getUserPermissions(user.id);
		const isBoard = authorizable.rootNode instanceof ColumnBoard || authorizable.rootNode instanceof MediaBoard;

		switch (checkType) {
			case 'EDIT':
				return isBoard && permissions.includes(Permission.BOARD_EDIT);

			case 'MANAGE':
				return isBoard && permissions.includes(Permission.BOARD_MANAGE);

			case 'VIEW':
				return isBoard && permissions.includes(Permission.BOARD_VIEW);

			case 'SUBMISSION_OWNER':
				return this.isSubmissionItemOfUser(user, authorizable);

			case 'MANAGE_READERS_CAN_EDIT':
				return (
					authorizable.boardNode instanceof ColumnBoard &&
					permissions.includes(Permission.BOARD_MANAGE_READERS_CAN_EDIT)
				);

			case 'RELOCATE_CONTENT':
				return (
					authorizable.rootNode instanceof ColumnBoard &&
					permissions.includes(Permission.BOARD_RELOCATE_CONTENT)
				);

			default:
				return false;
		}
	}

	/**
	 * Generic check method - can be used directly or through semantic wrappers
	 */
	private can(action: string, user: User, authorizable: BoardNodeAuthorizable): boolean {
		const checkType = this.permissionMatrix[action];
		if (!checkType) {
			throw new Error(`Unknown action: ${action}`);
		}
		return this.checkPermission(checkType, user, authorizable);
	}

	// -------------------------------------------------------------------------
	// Semantic Methods (DDD-friendly interface)
	// These are one-liners that delegate to the generic `can` method
	// -------------------------------------------------------------------------

	// Card actions
	public canCopyCard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('copyCard', user, authorizable);
	}

	public canCreateCard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('createCard', user, authorizable);
	}

	public canDeleteCard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('deleteCard', user, authorizable);
	}

	public canMoveCard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('moveCard', user, authorizable);
	}

	public canUpdateCardHeight(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('updateCardHeight', user, authorizable);
	}

	public canUpdateCardTitle(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('updateCardTitle', user, authorizable);
	}

	public canFindCards(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('findCards', user, authorizable);
	}

	// Column actions
	public canCreateColumn(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('createColumn', user, authorizable);
	}

	public canDeleteColumn(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('deleteColumn', user, authorizable);
	}

	public canMoveColumn(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('moveColumn', user, authorizable);
	}

	public canUpdateColumnTitle(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('updateColumnTitle', user, authorizable);
	}

	// Element actions
	public canCreateElement(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('createElement', user, authorizable);
	}

	public canDeleteElement(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('deleteElement', user, authorizable);
	}

	public canMoveElement(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('moveElement', user, authorizable);
	}

	public canUpdateElement(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('updateElement', user, authorizable);
	}

	public canViewElement(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('viewElement', user, authorizable);
	}

	// Board actions
	public canFindBoard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('findBoard', user, authorizable);
	}

	public canCopyBoard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('copyBoard', user, authorizable);
	}

	public canDeleteBoard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('deleteBoard', user, authorizable);
	}

	public canUpdateBoardTitle(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('updateBoardTitle', user, authorizable);
	}

	public canUpdateBoardVisibility(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('updateBoardVisibility', user, authorizable);
	}

	public canUpdateBoardLayout(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('updateBoardLayout', user, authorizable);
	}

	// Media board actions
	public canViewMediaBoard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('viewMediaBoard', user, authorizable);
	}

	public canCreateMediaBoardLine(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('createMediaBoardLine', user, authorizable);
	}

	public canDeleteMediaBoardLine(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('deleteMediaBoardLine', user, authorizable);
	}

	public canUpdateMediaBoardLine(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('updateMediaBoardLine', user, authorizable);
	}

	public canUpdateMediaBoardColor(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('updateMediaBoardColor', user, authorizable);
	}

	public canUpdateMediaBoardLayout(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('updateMediaBoardLayout', user, authorizable);
	}

	public canCollapseMediaBoard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('collapseMediaBoard', user, authorizable);
	}

	// Submission actions
	public canCreateSubmissionItemContent(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('createSubmissionItemContent', user, authorizable);
	}

	public canDeleteSubmissionItem(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('deleteSubmissionItem', user, authorizable);
	}

	public canUpdateSubmissionItem(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('updateSubmissionItem', user, authorizable);
	}

	// Special actions
	public canUpdateReadersCanEditSetting(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('updateReadersCanEditSetting', user, authorizable);
	}

	public canRelocateContent(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('relocateContent', user, authorizable);
	}

	// -------------------------------------------------------------------------
	// Helper Methods
	// -------------------------------------------------------------------------

	private isSubmissionItemOfUser(user: User, authorizable: BoardNodeAuthorizable): boolean {
		const { boardNode } = authorizable;
		return boardNode instanceof SubmissionItem && boardNode.userId === user.id;
	}

	// Required by Rule interface
	isApplicable(user: User, object: unknown): boolean {
		return object instanceof BoardNodeAuthorizable;
	}

	hasPermission(user: User, authorizable: BoardNodeAuthorizable, context: AuthorizationContext): boolean {
		// Original complex logic stays here
		return true;
	}
}

/**
 * COMPARISON SUMMARY:
 *
 * ORIGINAL CODE:
 * - ~20 methods that call canEditBoard()
 * - ~3 methods that call canManageBoard()
 * - ~3 methods that call canViewBoard()
 * - Each method is 3 lines with an explicit call
 *
 * REFACTORED CODE:
 * - Permission matrix defines all mappings in one place
 * - Single checkPermission() method with the actual logic
 * - Semantic methods are 1-liners that delegate to can()
 * - Easy to see all permission mappings at a glance
 * - Easy to change a permission check (just update the matrix)
 * - Easy to add new actions (add to matrix + add semantic method)
 *
 * TRADE-OFFS:
 * + Less code duplication
 * + Single source of truth for permission mappings
 * + Easier to audit all permissions
 * - Slight indirection (matrix lookup)
 * - Need to keep matrix and methods in sync (can be solved with code generation)
 */

