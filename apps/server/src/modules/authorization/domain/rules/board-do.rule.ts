import { Injectable } from '@nestjs/common';
import { BoardDoAuthorizable, BoardRoles, UserBoardRoles } from '@shared/domain/domainobject/board/types';
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

		// permission< for elements under a submission item are handled by the parent submission item
		if (isSubmissionItem(boardDoAuthorizable.parentDo)) {
			const parentDoAuthorizable = {
				boardDo: boardDoAuthorizable.parentDo,
				users: boardDoAuthorizable.users,
			} as BoardDoAuthorizable; // TODO fix this

			if (boardDoAuthorizable.boardDo && isSubmissionItemContent(boardDoAuthorizable.boardDo)) {
				return this.hasPermission(user, parentDoAuthorizable, context);
			}
			return false;
		}

		// files from drawingElement
		// no matter the action, as long as the user has read permission on the drawing element, he has write permission on the file
		if (isDrawingElement(boardDoAuthorizable.parentDo)) {
			const parentDoAuthorizable = boardDoAuthorizable;
			parentDoAuthorizable.boardDo = boardDoAuthorizable.parentDo;
			parentDoAuthorizable.parentDo = undefined;
			const drawElementContext = { ...context, action: Action.read };
			return this.hasPermission(user, parentDoAuthorizable, drawElementContext);
		}

		if (context.action === Action.write) {
			return isSubmissionItem(boardDoAuthorizable.boardDo)
				? this.hasSubmissionItemWritePermission(userBoardRoles, boardDoAuthorizable.boardDo)
				: this.isEditor(userBoardRoles);
		}

		return isSubmissionItem(boardDoAuthorizable.boardDo)
			? this.hasSubmissiontemReadPermission(userBoardRoles, boardDoAuthorizable.boardDo)
			: this.isReader(userBoardRoles);
	}

	private isEditor(userBoardRole: UserBoardRoles): boolean {
		return userBoardRole.roles.includes(BoardRoles.EDITOR);
	}

	private isReader(userBoardRole: UserBoardRoles): boolean {
		return userBoardRole.roles.includes(BoardRoles.READER) || userBoardRole.roles.includes(BoardRoles.EDITOR);
	}

	private hasSubmissionItemWritePermission(userBoardRoles: UserBoardRoles, submissionItem: SubmissionItem): boolean {
		// teacher don't have write access
		if (this.isEditor(userBoardRoles)) {
			return false;
		}

		// student has write access only for his own submission item
		if (this.isReader(userBoardRoles) && this.isSubmissionItemCreator(userBoardRoles.userId, submissionItem)) {
			return true;
		}

		return false;
	}

	private hasSubmissiontemReadPermission(userBoardRoles: UserBoardRoles, submissionItem: SubmissionItem): boolean {
		if (this.isEditor(userBoardRoles)) {
			return true;
		}

		if (this.isReader(userBoardRoles) && this.isSubmissionItemCreator(userBoardRoles.userId, submissionItem)) {
			return true;
		}

		return false;
	}

	protected isSubmissionItemCreator(userId: EntityId, submissionItem: SubmissionItem): boolean {
		return submissionItem.userId === userId;
	}
}
