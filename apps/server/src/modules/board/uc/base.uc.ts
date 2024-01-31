import { Action, AuthorizationService } from '@modules/authorization';
import { ForbiddenException } from '@nestjs/common';
import { AnyBoardDo, SubmissionItem, UserRoleEnum } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
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

	protected checkCreator(userId: EntityId, submissionItem: SubmissionItem): void {
		if (submissionItem.userId !== userId) {
			throw new ForbiddenException();
		}
	}
}
