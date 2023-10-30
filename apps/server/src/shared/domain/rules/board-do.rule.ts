import { Injectable } from '@nestjs/common';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { Action } from '@src/modules/authorization/types/action.enum';
import { AuthorizationContext } from '@src/modules/authorization/types/authorization-context.interface';
import { Rule } from '@src/modules/authorization/types/rule.interface';
import { BoardDoAuthorizable, BoardRoles } from '../domainobject/board/types/board-do-authorizable';
import { User } from '../entity/user.entity';

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
