import { Action, AuthorizationContext, AuthorizationInjectionService, Rule } from '@modules/authorization';
import {
	BoardNodeAuthorizable,
	BoardRoles,
	ColumnBoard,
	isDrawingElement,
	isSubmissionItem,
	isSubmissionItemContent,
	SubmissionItem,
	UserWithBoardRoles,
} from '@modules/board';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { isVideoConferenceElement } from '../domain';

@Injectable()
export class BoardNodeRule implements Rule<BoardNodeAuthorizable> {
	constructor(authorisationInjectionService: AuthorizationInjectionService) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof BoardNodeAuthorizable;

		return isMatched;
	}

	public hasPermission(user: User, authorizable: BoardNodeAuthorizable, context: AuthorizationContext): boolean {
		const hasAllPermissions = this.hasAllPermissions(user, authorizable, context.requiredPermissions);
		if (!hasAllPermissions) {
			return false;
		}

		const userWithBoardRoles = authorizable.users.find(({ userId }) => userId === user.id);
		if (!userWithBoardRoles) {
			return false;
		}

		if (
			authorizable.rootNode instanceof ColumnBoard &&
			!authorizable.rootNode.isVisible &&
			!this.isBoardEditor(userWithBoardRoles)
		) {
			return false;
		}

		if (this.shouldProcessSubmissionItem(authorizable)) {
			return this.hasPermissionForSubmissionItem(user, userWithBoardRoles, authorizable, context);
		}

		if (this.shouldProcessDrawingElementFile(authorizable, context)) {
			return this.hasPermissionForDrawingElementFile(userWithBoardRoles);
		}

		if (this.shouldProcessVideoConferenceElement(authorizable)) {
			return this.hasPermissionForVideoConferenceElement(userWithBoardRoles, context, authorizable);
		}

		if (context.action === Action.write) {
			return this.hasAllPermissions(user, authorizable, [Permission.BOARD_EDIT]);
		}

		return this.isBoardReader(userWithBoardRoles);
	}

	private hasAllPermissions(
		user: User,
		authorizable: BoardNodeAuthorizable,
		requiredPermissions: Permission[]
	): boolean {
		const schoolPermissions = user.resolvePermissions();
		const boardPermissions = authorizable.getUserPermissions(user.id);

		const permissions = Array.from(new Set([...schoolPermissions, ...boardPermissions]));
		return requiredPermissions.every((p) => permissions.includes(p));
	}

	private isBoardAdmin(userWithBoardRoles: UserWithBoardRoles): boolean {
		return userWithBoardRoles.roles.includes(BoardRoles.ADMIN);
	}

	private isBoardEditor(userWithBoardRoles: UserWithBoardRoles): boolean {
		return userWithBoardRoles.roles.includes(BoardRoles.EDITOR);
	}

	private isBoardReader(userWithBoardRoles: UserWithBoardRoles): boolean {
		return [BoardRoles.READER, BoardRoles.EDITOR].some((role) => userWithBoardRoles.roles.includes(role));
	}

	private shouldProcessDrawingElementFile(
		boardNodeAuthorizable: BoardNodeAuthorizable,
		context: AuthorizationContext
	): boolean {
		const requiresFileStoragePermission =
			context.requiredPermissions.includes(Permission.FILESTORAGE_CREATE) ||
			context.requiredPermissions.includes(Permission.FILESTORAGE_VIEW) ||
			context.requiredPermissions.includes(Permission.FILESTORAGE_REMOVE);

		return isDrawingElement(boardNodeAuthorizable.boardNode) && requiresFileStoragePermission;
	}

	private hasPermissionForDrawingElementFile(userWithBoardRoles: UserWithBoardRoles): boolean {
		// check if user has read permissions with no account for the context.action
		// because everyone should be able to upload files to a drawing element
		return this.isBoardReader(userWithBoardRoles);
	}

	private shouldProcessSubmissionItem(boardNodeAuthorizable: BoardNodeAuthorizable): boolean {
		return isSubmissionItem(boardNodeAuthorizable.boardNode) || isSubmissionItem(boardNodeAuthorizable.parentNode);
	}

	private hasPermissionForSubmissionItem(
		user: User,
		userWithBoardRoles: UserWithBoardRoles,
		boardNodeAuthorizable: BoardNodeAuthorizable,
		context: AuthorizationContext
	): boolean {
		// permission for elements under a submission item, are handled by the parent submission item
		if (isSubmissionItem(boardNodeAuthorizable.parentNode)) {
			if (!isSubmissionItemContent(boardNodeAuthorizable.boardNode)) {
				return false;
			}
			boardNodeAuthorizable.boardNode = boardNodeAuthorizable.parentNode;
			boardNodeAuthorizable.parentNode = undefined;
		}

		if (!isSubmissionItem(boardNodeAuthorizable.boardNode)) {
			/* istanbul ignore next */
			throw new Error('BoardDoAuthorizable.boardDo is not a submission item');
		}

		if (context.action === Action.write) {
			return this.hasSubmissionItemWritePermission(userWithBoardRoles, boardNodeAuthorizable.boardNode);
		}

		return this.hasSubmissionItemReadPermission(userWithBoardRoles, boardNodeAuthorizable.boardNode);
	}

	private hasSubmissionItemWritePermission(
		userWithBoardRoless: UserWithBoardRoles,
		submissionItem: SubmissionItem
	): boolean {
		// teacher don't have write access
		if (this.isBoardEditor(userWithBoardRoless)) {
			return false;
		}

		// student has write access only for his own submission item
		if (
			this.isBoardReader(userWithBoardRoless) &&
			this.isSubmissionItemCreator(userWithBoardRoless.userId, submissionItem)
		) {
			return true;
		}

		return false;
	}

	private hasSubmissionItemReadPermission(
		userWithBoardRoless: UserWithBoardRoles,
		submissionItem: SubmissionItem
	): boolean {
		if (this.isBoardEditor(userWithBoardRoless)) {
			return true;
		}

		if (
			this.isBoardReader(userWithBoardRoless) &&
			this.isSubmissionItemCreator(userWithBoardRoless.userId, submissionItem)
		) {
			return true;
		}

		return false;
	}

	private isSubmissionItemCreator(userId: EntityId, submissionItem: SubmissionItem): boolean {
		return submissionItem.userId === userId;
	}

	private shouldProcessVideoConferenceElement(boardNodeAuthorizable: BoardNodeAuthorizable): boolean {
		return isVideoConferenceElement(boardNodeAuthorizable.boardNode);
	}

	private hasPermissionForVideoConferenceElement(
		userWithBoardRoles: UserWithBoardRoles,
		context: AuthorizationContext,
		authorizable: BoardNodeAuthorizable
	): boolean {
		if (context.action === Action.write) {
			const canRoomEditorManageVideoconference =
				authorizable.boardContextSettings.canRoomEditorManageVideoconference ?? false;
			return (
				(canRoomEditorManageVideoconference && this.isBoardEditor(userWithBoardRoles)) ||
				this.isBoardAdmin(userWithBoardRoles)
			);
		}

		return this.isBoardReader(userWithBoardRoles);
	}
}
