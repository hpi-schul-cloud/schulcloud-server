/**
 * POLICY PATTERN APPROACH
 *
 * This approach uses the Strategy/Policy pattern where each permission check
 * is encapsulated in its own policy class. Policies can be composed and reused.
 *
 * Benefits:
 * - Each policy is independently testable
 * - Policies can be composed (AND, OR combinations)
 * - Easy to add new policies without modifying existing code
 * - Follows Open/Closed Principle
 */

import { Permission } from '@shared/domain/interface';
import { User } from '@modules/user/repo';
import { BoardNodeAuthorizable, ColumnBoard, MediaBoard, SubmissionItem } from '../../domain';

// ============================================================================
// POLICY INTERFACES
// ============================================================================

/**
 * Base interface for all authorization policies
 */
export interface BoardPolicy {
	isSatisfiedBy(user: User, authorizable: BoardNodeAuthorizable): boolean;
}

// ============================================================================
// CONCRETE POLICIES
// ============================================================================

/**
 * Policy: User can edit the board
 */
export class CanEditBoardPolicy implements BoardPolicy {
	isSatisfiedBy(user: User, authorizable: BoardNodeAuthorizable): boolean {
		const permissions = authorizable.getUserPermissions(user.id);
		const isBoard = authorizable.rootNode instanceof ColumnBoard || authorizable.rootNode instanceof MediaBoard;
		return isBoard && permissions.includes(Permission.BOARD_EDIT);
	}
}

/**
 * Policy: User can manage the board
 */
export class CanManageBoardPolicy implements BoardPolicy {
	isSatisfiedBy(user: User, authorizable: BoardNodeAuthorizable): boolean {
		const permissions = authorizable.getUserPermissions(user.id);
		const isBoard = authorizable.rootNode instanceof ColumnBoard || authorizable.rootNode instanceof MediaBoard;
		return isBoard && permissions.includes(Permission.BOARD_MANAGE);
	}
}

/**
 * Policy: User can view the board
 */
export class CanViewBoardPolicy implements BoardPolicy {
	isSatisfiedBy(user: User, authorizable: BoardNodeAuthorizable): boolean {
		const permissions = authorizable.getUserPermissions(user.id);
		const isBoard = authorizable.rootNode instanceof ColumnBoard || authorizable.rootNode instanceof MediaBoard;
		return isBoard && permissions.includes(Permission.BOARD_VIEW);
	}
}

/**
 * Policy: User owns the submission item
 */
export class IsSubmissionItemOwnerPolicy implements BoardPolicy {
	isSatisfiedBy(user: User, authorizable: BoardNodeAuthorizable): boolean {
		const { boardNode } = authorizable;
		return boardNode instanceof SubmissionItem && boardNode.userId === user.id;
	}
}

/**
 * Policy: User can manage readers-can-edit setting
 */
export class CanManageReadersCanEditPolicy implements BoardPolicy {
	isSatisfiedBy(user: User, authorizable: BoardNodeAuthorizable): boolean {
		const permissions = authorizable.getUserPermissions(user.id);
		const isColumnBoard = authorizable.boardNode instanceof ColumnBoard;
		return isColumnBoard && permissions.includes(Permission.BOARD_MANAGE_READERS_CAN_EDIT);
	}
}

/**
 * Policy: User can relocate content
 */
export class CanRelocateContentPolicy implements BoardPolicy {
	isSatisfiedBy(user: User, authorizable: BoardNodeAuthorizable): boolean {
		const permissions = authorizable.getUserPermissions(user.id);
		const isColumnBoard = authorizable.rootNode instanceof ColumnBoard;
		return isColumnBoard && permissions.includes(Permission.BOARD_RELOCATE_CONTENT);
	}
}

// ============================================================================
// COMPOSITE POLICIES (for combining multiple policies)
// ============================================================================

/**
 * AND Policy: All policies must be satisfied
 */
export class AndPolicy implements BoardPolicy {
	constructor(private readonly policies: BoardPolicy[]) {}

	isSatisfiedBy(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.policies.every((policy) => policy.isSatisfiedBy(user, authorizable));
	}
}

/**
 * OR Policy: At least one policy must be satisfied
 */
export class OrPolicy implements BoardPolicy {
	constructor(private readonly policies: BoardPolicy[]) {}

	isSatisfiedBy(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.policies.some((policy) => policy.isSatisfiedBy(user, authorizable));
	}
}

/**
 * NOT Policy: Inverts a policy
 */
export class NotPolicy implements BoardPolicy {
	constructor(private readonly policy: BoardPolicy) {}

	isSatisfiedBy(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return !this.policy.isSatisfiedBy(user, authorizable);
	}
}

// ============================================================================
// POLICY FACTORY / REGISTRY
// ============================================================================

/**
 * Factory that provides the correct policy for each domain action.
 * This is where the mapping between actions and policies lives.
 */
export class BoardPolicyFactory {
	// Singleton instances for reuse
	private static readonly editBoardPolicy = new CanEditBoardPolicy();
	private static readonly manageBoardPolicy = new CanManageBoardPolicy();
	private static readonly viewBoardPolicy = new CanViewBoardPolicy();
	private static readonly submissionOwnerPolicy = new IsSubmissionItemOwnerPolicy();
	private static readonly manageReadersCanEditPolicy = new CanManageReadersCanEditPolicy();
	private static readonly relocateContentPolicy = new CanRelocateContentPolicy();

	/**
	 * Get the policy for a specific action
	 */
	static getPolicyFor(action: string): BoardPolicy {
		const policyMap: Record<string, BoardPolicy> = {
			// Card actions
			copyCard: this.editBoardPolicy,
			createCard: this.editBoardPolicy,
			deleteCard: this.editBoardPolicy,
			moveCard: this.editBoardPolicy,
			updateCardHeight: this.editBoardPolicy,
			updateCardTitle: this.editBoardPolicy,
			findCards: this.viewBoardPolicy,

			// Column actions
			createColumn: this.editBoardPolicy,
			deleteColumn: this.editBoardPolicy,
			moveColumn: this.editBoardPolicy,
			updateColumnTitle: this.editBoardPolicy,

			// Element actions
			createElement: this.editBoardPolicy,
			deleteElement: this.editBoardPolicy,
			moveElement: this.editBoardPolicy,
			updateElement: this.editBoardPolicy,
			viewElement: this.viewBoardPolicy,

			// Board actions
			findBoard: this.viewBoardPolicy,
			copyBoard: this.manageBoardPolicy,
			deleteBoard: this.manageBoardPolicy,
			updateBoardTitle: this.editBoardPolicy,
			updateBoardVisibility: this.manageBoardPolicy,
			updateBoardLayout: this.manageBoardPolicy,

			// Media board actions
			viewMediaBoard: this.viewBoardPolicy,
			createMediaBoardLine: this.editBoardPolicy,
			deleteMediaBoardLine: this.editBoardPolicy,
			updateMediaBoardLine: this.editBoardPolicy,
			updateMediaBoardColor: this.editBoardPolicy,
			updateMediaBoardLayout: this.editBoardPolicy,
			collapseMediaBoard: this.editBoardPolicy,

			// Submission actions
			createSubmissionItemContent: this.submissionOwnerPolicy,
			deleteSubmissionItem: this.submissionOwnerPolicy,
			updateSubmissionItem: this.submissionOwnerPolicy,

			// Special actions
			updateReadersCanEditSetting: this.manageReadersCanEditPolicy,
			relocateContent: this.relocateContentPolicy,
		};

		const policy = policyMap[action];
		if (!policy) {
			throw new Error(`No policy found for action: ${action}`);
		}
		return policy;
	}
}

// ============================================================================
// AUTHORIZATION SERVICE using Policy Pattern
// ============================================================================

/**
 * Clean authorization service that delegates to policies
 */
export class BoardAuthorizationService {
	/**
	 * Generic authorization check
	 */
	can(action: string, user: User, authorizable: BoardNodeAuthorizable): boolean {
		const policy = BoardPolicyFactory.getPolicyFor(action);
		return policy.isSatisfiedBy(user, authorizable);
	}

	// You can still have semantic methods that use the generic `can` internally
	// This gives you the best of both worlds: domain terminology + no code duplication

	canCopyCard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('copyCard', user, authorizable);
	}

	canCreateCard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('createCard', user, authorizable);
	}

	canDeleteBoard(user: User, authorizable: BoardNodeAuthorizable): boolean {
		return this.can('deleteBoard', user, authorizable);
	}

	// ... etc - all methods become one-liners
}

// ============================================================================
// ADVANCED: DECORATOR-BASED APPROACH (Bonus)
// ============================================================================

/**
 * You could even use decorators to make it more declarative:
 *
 * class BoardAuthService {
 *   @RequiresPolicy(CanEditBoardPolicy)
 *   canCopyCard(user: User, authorizable: BoardNodeAuthorizable): boolean {
 *     return true; // The decorator handles the actual check
 *   }
 * }
 */

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * USAGE EXAMPLE 1: Using the service directly
 *
 * const authService = new BoardAuthorizationService();
 *
 * // Using semantic methods (same as before)
 * if (authService.canCopyCard(user, authorizable)) { ... }
 *
 * // Or using generic method
 * if (authService.can('copyCard', user, authorizable)) { ... }
 */

/**
 * USAGE EXAMPLE 2: Composing policies for complex scenarios
 *
 * // User can edit OR is admin
 * const editOrAdminPolicy = new OrPolicy([
 *   new CanEditBoardPolicy(),
 *   new CanManageBoardPolicy()
 * ]);
 *
 * // User can edit AND owns the submission
 * const editAndOwnerPolicy = new AndPolicy([
 *   new CanEditBoardPolicy(),
 *   new IsSubmissionItemOwnerPolicy()
 * ]);
 */

/**
 * USAGE EXAMPLE 3: Easy to add new policies
 *
 * // Just create a new policy class
 * class CanModerateCommentsPolicy implements BoardPolicy {
 *   isSatisfiedBy(user: User, authorizable: BoardNodeAuthorizable): boolean {
 *     const permissions = authorizable.getUserPermissions(user.id);
 *     return permissions.includes(Permission.BOARD_MODERATE_COMMENTS);
 *   }
 * }
 *
 * // And add it to the factory
 */

