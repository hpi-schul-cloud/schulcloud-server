import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity/user.entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
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
import { AuthorizationHelper } from '../service/authorization.helper';
import { Action, AuthorizationContext, Rule } from '../type';

@Injectable()
export class BoardNodeRule implements Rule {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, boardNodeAuthorizable: unknown): boolean {
		const isMatched = boardNodeAuthorizable instanceof BoardNodeAuthorizable;

		return isMatched;
	}

	public hasPermission(
		user: User,
		boardNodeAuthorizable: BoardNodeAuthorizable,
		context: AuthorizationContext
	): boolean {
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);
		if (!hasPermission) {
			return false;
		}

		const userWithBoardRoles = boardNodeAuthorizable.users.find(({ userId }) => userId === user.id);
		if (!userWithBoardRoles) {
			return false;
		}

		if (
			boardNodeAuthorizable.rootNode instanceof ColumnBoard &&
			!boardNodeAuthorizable.rootNode.isVisible &&
			!this.isBoardEditor(userWithBoardRoles)
		) {
			return false;
		}

		if (this.shouldProcessSubmissionItem(boardNodeAuthorizable)) {
			return this.hasPermissionForSubmissionItem(user, userWithBoardRoles, boardNodeAuthorizable, context);
		}

		if (this.shouldProcessDrawingElementFile(boardNodeAuthorizable, context)) {
			return this.hasPermissionForDrawingElementFile(userWithBoardRoles);
		}

		if (this.shouldProcessDrawingElement(boardNodeAuthorizable)) {
			return this.hasPermissionForDrawingElement(userWithBoardRoles, context);
		}

		if (context.action === Action.write) {
			return this.isBoardEditor(userWithBoardRoles);
		}

		return this.isBoardReader(userWithBoardRoles);
	}

	private isBoardEditor(userWithBoardRoles: UserWithBoardRoles): boolean {
		return userWithBoardRoles.roles.includes(BoardRoles.EDITOR);
	}

	private isBoardReader(userWithBoardRoles: UserWithBoardRoles): boolean {
		return userWithBoardRoles.roles.includes(BoardRoles.READER) || userWithBoardRoles.roles.includes(BoardRoles.EDITOR);
	}

	private shouldProcessDrawingElementFile(
		boardNodeAuthorizable: BoardNodeAuthorizable,
		context: AuthorizationContext
	): boolean {
		const requiresFileStoragePermission =
			context.requiredPermissions.includes(Permission.FILESTORAGE_CREATE) ||
			context.requiredPermissions.includes(Permission.FILESTORAGE_VIEW);

		return isDrawingElement(boardNodeAuthorizable.boardNode) && requiresFileStoragePermission;
	}

	private shouldProcessDrawingElement(boardNodeAuthorizable: BoardNodeAuthorizable): boolean {
		return isDrawingElement(boardNodeAuthorizable.boardNode);
	}

	private hasPermissionForDrawingElementFile(userWithBoardRoles: UserWithBoardRoles): boolean {
		// check if user has read permissions with no account for the context.action
		// because everyone should be able to upload files to a drawing element
		return this.isBoardReader(userWithBoardRoles);
	}

	private hasPermissionForDrawingElement(
		userWithBoardRoles: UserWithBoardRoles,
		context: AuthorizationContext
	): boolean {
		if (context.action === Action.write) {
			return this.isBoardEditor(userWithBoardRoles);
		}

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
}
