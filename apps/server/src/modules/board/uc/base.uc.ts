import { Action, AuthorizationService } from '@modules/authorization';
import { ForbiddenException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { AnyBoardDo, SubmissionItem, UserRoleEnum } from '@shared/domain/domainobject';
import { BoardDoAuthorizableService } from '../service';

export abstract class BaseUc {
	constructor(
		protected readonly authorizationService: AuthorizationService,
		protected readonly boardDoAuthorizableService: BoardDoAuthorizableService
	) {}

	protected async checkPermission(
		userId: EntityId,
		anyBoardDo: AnyBoardDo,
		action: Action,
		requiredUserRole?: UserRoleEnum
	): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(anyBoardDo);
		if (requiredUserRole) {
			boardDoAuthorizable.requiredUserRole = requiredUserRole;
		}
		const context = { action, requiredPermissions: [] };

		return this.authorizationService.checkPermission(user, boardDoAuthorizable, context);
	}

	protected async isAuthorizedStudent(userId: EntityId, boardDo: AnyBoardDo): Promise<boolean> {
		const boardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(boardDo);
		const userRoleEnum = boardDoAuthorizable.users.find((u) => u.userId === userId)?.userRoleEnum;

		if (!userRoleEnum) {
			throw new ForbiddenException('User not part of this board');
		}

		// TODO do this with permission instead of role and using authorizable rules
		if (userRoleEnum === UserRoleEnum.STUDENT) {
			return true;
		}

		return false;
	}

	protected async checkSubmissionItemWritePermission(userId: EntityId, submissionItem: SubmissionItem) {
		if (submissionItem.userId !== userId) {
			throw new ForbiddenException();
		}
		await this.checkPermission(userId, submissionItem, Action.read, UserRoleEnum.STUDENT);
	}
}
