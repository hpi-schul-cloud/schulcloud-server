import { AnyBoardDo, ColumnBoard, EntityId, PermissionCrud, SubmissionItem, UserRoleEnum } from '@shared/domain';
import { ForbiddenException } from '@nestjs/common';
import { AuthorizationService, Action, PermissionContextService } from '@modules/authorization';
import { BoardDoAuthorizableService } from '../service';

export abstract class BaseUc {
	constructor(
		protected readonly authorizationService: AuthorizationService,
		protected readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		protected readonly permissionContextService: PermissionContextService
	) {}

	protected async pocHasPermission(
		userId: EntityId,
		contextReference: EntityId,
		permissionsToContain: PermissionCrud[]
	): Promise<boolean> {
		const permissions = await this.permissionContextService.resolvePermissions(userId, contextReference);
		const hasPermission = permissionsToContain.every((permission) => permissions.includes(permission));
		return hasPermission;
	}

	protected async pocCheckPermission(
		userId: EntityId,
		contextReference: EntityId,
		permissionsToContain: PermissionCrud[]
	): Promise<void> {
		const hasPermission = await this.pocHasPermission(userId, contextReference, permissionsToContain);
		if (!hasPermission) {
			throw new ForbiddenException();
		}
	}

	protected async pocFilterColumnBoardChildrenByPermission(userId: EntityId, columnBoard: ColumnBoard): Promise<void> {
		// NOTE: This function will be obsolete once the authorization can be applied in the repo level
		const columnsToRemove = await Promise.all(
			columnBoard.children.map(async (child) => {
				return {
					column: child,
					hasPermission: await this.pocHasPermission(userId, child.id, [PermissionCrud.READ]),
				};
			})
		);

		columnsToRemove.forEach((columnToRemove) => {
			if (!columnToRemove.hasPermission) {
				columnBoard.removeChild(columnToRemove.column);
			}
		});

		const cardsToRemove = await Promise.all(
			columnBoard.children
				.flatMap((child) => child.children)
				.map(async (child) => {
					return {
						card: child,
						hasPermission: await this.pocHasPermission(userId, child.id, [PermissionCrud.READ]),
					};
				})
		);

		cardsToRemove.forEach((cardToRemove) => {
			if (!cardToRemove.hasPermission) {
				columnBoard.removeChild(cardToRemove.card);
			}
		});
	}

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
