import { BoardRoles, UserWithBoardRoles } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { Permission } from '@shared/domain/interface';
import { ForbiddenException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { Action, AuthorizationService } from '../../../authorization';
import { AnyBoardNode } from '../domain';
import { BoardNodeAuthorizableService } from './board-node-authorizable.service';

@Injectable()
export class BoardNodePermissionService {
	constructor(
		@Inject(forwardRef(() => AuthorizationService))
		private readonly authorizationService: AuthorizationService,
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService
	) {}

	async checkPermission(userId: EntityId, boardNode: AnyBoardNode, action: Action): Promise<void> {
		const requiredPermissions: Permission[] = [];
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(boardNode);

		this.authorizationService.checkPermission(user, boardNodeAuthorizable, { action, requiredPermissions });
	}

	// TODO
	async checkBoardEditor(userId: EntityId, boardNode: AnyBoardNode): Promise<void> {
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(boardNode);
		if (this.isUserBoardEditor(userId, boardNodeAuthorizable.users)) {
			throw new ForbiddenException();
		}
	}

	isUserBoardEditor(userId: EntityId, userBoardRoles: UserWithBoardRoles[]): boolean {
		const boardDoAuthorisedUser = userBoardRoles.find((user) => user.userId === userId);

		if (boardDoAuthorisedUser) {
			return boardDoAuthorisedUser?.roles.includes(BoardRoles.EDITOR);
		}

		return false;
	}

	isUserBoardReader(userId: EntityId, userBoardRoles: UserWithBoardRoles[]): boolean {
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
