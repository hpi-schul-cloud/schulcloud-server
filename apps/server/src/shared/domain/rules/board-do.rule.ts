import { Injectable } from '@nestjs/common';
import { Action, AuthorizationContext, Rule } from '@src/modules/authorization';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { AnyBoardDo, BoardComposite, BoardDoAuthorizable, BoardRoles } from '../domainobject';
import { User } from '../entity';

@Injectable()
export class BoardDoRule implements Rule {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, domainObject: AnyBoardDo): boolean {
		const isMatched = domainObject instanceof BoardComposite;

		return isMatched;
	}

	public hasPermission(user: User, boardNodeAuthorizable: BoardDoAuthorizable, context: AuthorizationContext): boolean {
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);
		if (hasPermission === false) {
			return false;
		}

		const result = boardNodeAuthorizable.users.find(({ userId }) => userId === user.id);
		if (!result) {
			return false;
		}

		if (context.action === Action.write && result.roles.includes(BoardRoles.EDITOR)) {
			return true;
		}

		if (
			context.action === Action.read &&
			result.roles.includes(BoardRoles.EDITOR) &&
			result.roles.includes(BoardRoles.READER)
		) {
			return true;
		}

		return false;
	}
}
