import { Injectable } from '@nestjs/common';
import { BoardDoAuthorizable, BoardRoles, UserBoardRoles } from '@shared/domain/domainobject/board/types';
import { User } from '@shared/domain/entity/user.entity';
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

		if (boardDoAuthorizable.requiredUserRole && boardDoAuthorizable.requiredUserRole !== userBoardRoles.userRoleEnum) {
			return false;
		}

		switch (context.action) {
			case Action.write:
				return this.hasWritePermission(userBoardRoles);
			case Action.read:
				return this.hasReadPermission(userBoardRoles);
			default:
				return false;
		}
	}

	private hasWritePermission(userBoardRole: UserBoardRoles): boolean {
		return userBoardRole.roles.includes(BoardRoles.EDITOR);
	}

	private hasReadPermission(userBoardRole: UserBoardRoles): boolean {
		return userBoardRole.roles.includes(BoardRoles.READER) || userBoardRole.roles.includes(BoardRoles.EDITOR);
	}
}
