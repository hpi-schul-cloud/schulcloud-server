import { Action, AuthorizationService } from '@modules/authorization';
import { ForbiddenException } from '@nestjs/common';
import { AnyBoardDo, BoardRoles, SubmissionItem, UserBoardRoles } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { BoardDoAuthorizableService } from '../service';

export abstract class BaseUc {
	constructor(
		protected readonly authorizationService: AuthorizationService,
		protected readonly boardDoAuthorizableService: BoardDoAuthorizableService
	) {}

	protected async checkPermission(userId: EntityId, anyBoardDo: AnyBoardDo, action: Action): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(anyBoardDo);

		const context = { action, requiredPermissions: [] };

		return this.authorizationService.checkPermission(user, boardDoAuthorizable, context);
	}

	protected checkSubmissionItemCreator(userId: EntityId, submissionItem: SubmissionItem): void {
		if (submissionItem.userId !== userId) {
			throw new ForbiddenException();
		}
	}

	protected isUserBoardEditor(userId: EntityId, userBoardRoles: UserBoardRoles[]): boolean {
		const boardDoAuthorisedUser = userBoardRoles.filter((user) => user.userId === userId)[0];

		return boardDoAuthorisedUser && boardDoAuthorisedUser.roles.includes(BoardRoles.EDITOR);
	}

	protected isUserBoardReader(userId: EntityId, userBoardRoles: UserBoardRoles[]): boolean {
		const boardDoAuthorisedUser = userBoardRoles.filter((user) => user.userId === userId)[0];

		return (
			boardDoAuthorisedUser &&
			boardDoAuthorisedUser.roles.includes(BoardRoles.READER) &&
			!boardDoAuthorisedUser.roles.includes(BoardRoles.EDITOR)
		);
	}
}
