import { Injectable } from '@nestjs/common';
import { BoardDoAuthorizable, BoardRoles, UserWithBoardRoles } from '@shared/domain/domainobject/board/types';
import { User } from '@shared/domain/entity/user.entity';
import {
	isDrawingElement,
	isSubmissionItem,
	isSubmissionItemContent,
	SubmissionItem,
} from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { Permission } from '@shared/domain/interface';
import { Action, AuthorizationContext, Rule } from '../type';
import { AuthorizationHelper } from '../service/authorization.helper';

@Injectable()
export class BoardDoRule implements Rule {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, boardDoAuthorizable: BoardDoAuthorizable): boolean {
		const isMatched = boardDoAuthorizable instanceof BoardDoAuthorizable;

		return isMatched;
	}

	public hasPermission(user: User, boardDoAuthorizable: BoardDoAuthorizable, context: AuthorizationContext): boolean {
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);
		if (!hasPermission) {
			return false;
		}

		const userWithBoardRoles = boardDoAuthorizable.users.find(({ userId }) => userId === user.id);
		if (!userWithBoardRoles) {
			return false;
		}

		if (boardDoAuthorizable.rootDo.isVisible !== true && !this.isBoardEditor(userWithBoardRoles)) {
			return false;
		}

		if (this.shouldProcessSubmissionItem(boardDoAuthorizable)) {
			return this.hasPermissionForSubmissionItem(user, userWithBoardRoles, boardDoAuthorizable, context);
		}

		if (this.shouldProcessDrawingElementFile(boardDoAuthorizable, context)) {
			return this.hasPermissionForDrawingElementFile(userWithBoardRoles);
		}

		if (this.shouldProcessDrawingElement(boardDoAuthorizable)) {
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
		boardDoAuthorizable: BoardDoAuthorizable,
		context: AuthorizationContext
	): boolean {
		const requiresFileStoragePermission =
			context.requiredPermissions.includes(Permission.FILESTORAGE_CREATE) ||
			context.requiredPermissions.includes(Permission.FILESTORAGE_VIEW);

		return isDrawingElement(boardDoAuthorizable.boardDo) && requiresFileStoragePermission;
	}

	private shouldProcessDrawingElement(boardDoAuthorizable: BoardDoAuthorizable): boolean {
		return isDrawingElement(boardDoAuthorizable.boardDo);
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

	private shouldProcessSubmissionItem(boardDoAuthorizable: BoardDoAuthorizable): boolean {
		return isSubmissionItem(boardDoAuthorizable.boardDo) || isSubmissionItem(boardDoAuthorizable.parentDo);
	}

	private hasPermissionForSubmissionItem(
		user: User,
		userWithBoardRoles: UserWithBoardRoles,
		boardDoAuthorizable: BoardDoAuthorizable,
		context: AuthorizationContext
	): boolean {
		// permission for elements under a submission item, are handled by the parent submission item
		if (isSubmissionItem(boardDoAuthorizable.parentDo)) {
			if (!isSubmissionItemContent(boardDoAuthorizable.boardDo)) {
				return false;
			}
			boardDoAuthorizable.boardDo = boardDoAuthorizable.parentDo;
			boardDoAuthorizable.parentDo = undefined;
		}

		if (!isSubmissionItem(boardDoAuthorizable.boardDo)) {
			/* istanbul ignore next */
			throw new Error('BoardDoAuthorizable.boardDo is not a submission item');
		}

		if (context.action === Action.write) {
			return this.hasSubmissionItemWritePermission(userWithBoardRoles, boardDoAuthorizable.boardDo);
		}

		return this.hasSubmissionItemReadPermission(userWithBoardRoles, boardDoAuthorizable.boardDo);
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
