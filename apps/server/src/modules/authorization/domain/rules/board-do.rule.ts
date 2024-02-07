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

		const userBoardRoles = boardDoAuthorizable.users.find(({ userId }) => userId === user.id);
		if (!userBoardRoles) {
			return false;
		}

		if (this.shouldProcessParentDo(boardDoAuthorizable)) {
			const parentDoPermission = this.handlePermissionForParentDo(user, boardDoAuthorizable, context);
			if (parentDoPermission !== undefined) {
				return parentDoPermission;
			}
		}

		if (isSubmissionItem(boardDoAuthorizable.boardDo)) {
			return this.hasPermissionForSubmissionItem(userBoardRoles, boardDoAuthorizable, context);
		}

		if (context.action === Action.write) {
			return this.isBoardEditor(userBoardRoles);
		}

		return this.isBoardReader(userBoardRoles);
	}

	private isBoardEditor(userBoardRole: UserWithBoardRoles): boolean {
		return userBoardRole.roles.includes(BoardRoles.EDITOR);
	}

	private isBoardReader(userBoardRole: UserWithBoardRoles): boolean {
		return userBoardRole.roles.includes(BoardRoles.READER) || userBoardRole.roles.includes(BoardRoles.EDITOR);
	}

	private shouldProcessParentDo(boardDoAuthorizable: BoardDoAuthorizable): boolean {
		if (!boardDoAuthorizable.parentDo) {
			return false;
		}
		if (isSubmissionItem(boardDoAuthorizable.parentDo)) {
			return true;
		}
		if (isDrawingElement(boardDoAuthorizable.parentDo)) {
			return true;
		}
		return false;
	}

	private handlePermissionForParentDo(
		user: User,
		boardDoAuthorizable: BoardDoAuthorizable,
		context: AuthorizationContext
	): boolean {
		if (!boardDoAuthorizable.parentDo) {
			/* istanbul ignore next */
			throw new Error('BoardDoAuthorizable.parentDo is undefined');
		}

		// permission< for elements under a submission item are handled by the parent submission item
		if (isSubmissionItem(boardDoAuthorizable.parentDo)) {
			if (!boardDoAuthorizable.boardDo || !isSubmissionItemContent(boardDoAuthorizable.boardDo)) {
				return false;
			}
		}

		// files from drawingElement
		// no matter the action, as long as the user has read permission on the drawing element, he has write permission on the file
		if (isDrawingElement(boardDoAuthorizable.parentDo)) {
			context.action = Action.read;
		}

		boardDoAuthorizable.boardDo = boardDoAuthorizable.parentDo;
		boardDoAuthorizable.parentDo = undefined;

		return this.hasPermission(user, boardDoAuthorizable, context);
	}

	private hasPermissionForSubmissionItem(
		userBoardRoles: UserWithBoardRoles,
		boardDoAuthorizable: BoardDoAuthorizable,
		context: AuthorizationContext
	): boolean {
		if (!isSubmissionItem(boardDoAuthorizable.boardDo)) {
			/* istanbul ignore next */
			throw new Error('BoardDoAuthorizable.boardDo is not a submission item');
		}
		if (context.action === Action.write) {
			return this.hasSubmissionItemWritePermission(userBoardRoles, boardDoAuthorizable.boardDo);
		}

		return this.hasSubmissiontemReadPermission(userBoardRoles, boardDoAuthorizable.boardDo);
	}

	private hasSubmissionItemWritePermission(
		userBoardRoles: UserWithBoardRoles,
		submissionItem: SubmissionItem
	): boolean {
		// teacher don't have write access
		if (this.isBoardEditor(userBoardRoles)) {
			return false;
		}

		// student has write access only for his own submission item
		if (this.isBoardReader(userBoardRoles) && this.isSubmissionItemCreator(userBoardRoles.userId, submissionItem)) {
			return true;
		}

		return false;
	}

	private hasSubmissiontemReadPermission(userBoardRoles: UserWithBoardRoles, submissionItem: SubmissionItem): boolean {
		if (this.isBoardEditor(userBoardRoles)) {
			return true;
		}

		if (this.isBoardReader(userBoardRoles) && this.isSubmissionItemCreator(userBoardRoles.userId, submissionItem)) {
			return true;
		}

		return false;
	}

	private isSubmissionItemCreator(userId: EntityId, submissionItem: SubmissionItem): boolean {
		return submissionItem.userId === userId;
	}
}
