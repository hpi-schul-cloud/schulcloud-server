import { Injectable } from '@nestjs/common';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { Action, AuthorizationContext, Rule } from '@src/modules/authorization/types';
import { BoardDoAuthorizable, BoardRoles } from '../domainobject';
import { User } from '../entity';

@Injectable()
export class BoardDoRule implements Rule {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, boardDoAuthorizable: BoardDoAuthorizable): boolean {
		const isMatched = boardDoAuthorizable instanceof BoardDoAuthorizable;

		return isMatched;
	}

	public hasPermission(user: User, boardDoAuthorizable: BoardDoAuthorizable, context: AuthorizationContext): boolean {
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);
		if (hasPermission === false) {
			return false;
		}

		const userBoardRole = boardDoAuthorizable.users.find(({ userId }) => userId === user.id);
		if (!userBoardRole) {
			return false;
		}

		if (boardDoAuthorizable.requiredUserRole && boardDoAuthorizable.requiredUserRole !== userBoardRole.userRoleEnum) {
			return false;
		}

		if (context.action === Action.write && userBoardRole.roles.includes(BoardRoles.EDITOR)) {
			return true;
		}

		if (
			context.action === Action.read &&
			(userBoardRole.roles.includes(BoardRoles.EDITOR) || userBoardRole.roles.includes(BoardRoles.READER))
		) {
			return true;
		}

		return false;
	}
}
