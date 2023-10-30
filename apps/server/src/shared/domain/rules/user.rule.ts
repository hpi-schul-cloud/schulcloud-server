import { Injectable } from '@nestjs/common';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { AuthorizationContext } from '@src/modules/authorization/types/authorization-context.interface';
import { Rule } from '@src/modules/authorization/types/rule.interface';
import { User } from '../entity/user.entity';

@Injectable()
export class UserRule implements Rule {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, entity: User): boolean {
		const isMatched = entity instanceof User;

		return isMatched;
	}

	public hasPermission(user: User, entity: User, context: AuthorizationContext): boolean {
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);
		const isOwner = user === entity;

		return hasPermission || isOwner;
	}
}
