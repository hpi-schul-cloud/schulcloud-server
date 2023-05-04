import { Injectable } from '@nestjs/common';
import { AuthorizationContext, Rule } from '@src/modules';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { AnyBoardDo, BoardComposite } from '../domainobject';
import { User } from '../entity';

@Injectable()
export class BoardNodeRule implements Rule {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, domainObject: AnyBoardDo): boolean {
		const isMatched = domainObject instanceof BoardComposite;

		return isMatched;
	}

	public hasPermission(user: User, domainObject: AnyBoardDo, context: AuthorizationContext): boolean {
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);

		// TODO: create really permission checks

		return hasPermission;
	}
}
