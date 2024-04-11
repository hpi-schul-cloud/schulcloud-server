import { Action, AuthorizationService } from '@modules/authorization';
import { AnyBoardDo, BoardRoles, UserWithBoardRoles } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { Permission } from '@shared/domain/interface';
import { BoardDoAuthorizableService } from '../service';

export abstract class BaseUc {
	constructor(
		protected readonly authorizationService: AuthorizationService,
		protected readonly boardDoAuthorizableService: BoardDoAuthorizableService
	) {}

	protected async checkPermission(userId: EntityId, anyBoardDo: AnyBoardDo, action: Action): Promise<void> {
		const requiredPermissions: Permission[] = [];
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(anyBoardDo);

		this.authorizationService.checkPermission(user, boardDoAuthorizable, { action, requiredPermissions });
	}

	protected isUserBoardEditor(userId: EntityId, userBoardRoles: UserWithBoardRoles[]): boolean {
		const boardDoAuthorisedUser = userBoardRoles.find((user) => user.userId === userId);

		if (boardDoAuthorisedUser) {
			return boardDoAuthorisedUser?.roles.includes(BoardRoles.EDITOR);
		}

		return false;
	}

	protected isUserBoardReader(userId: EntityId, userBoardRoles: UserWithBoardRoles[]): boolean {
		const boardDoAuthorisedUser = userBoardRoles.find((user) => user.userId === userId);

		if (boardDoAuthorisedUser) {
			return (
				boardDoAuthorisedUser.roles.includes(BoardRoles.READER) &&
				!boardDoAuthorisedUser.roles.includes(BoardRoles.EDITOR)
			);
		}

		return false;
	}
}
