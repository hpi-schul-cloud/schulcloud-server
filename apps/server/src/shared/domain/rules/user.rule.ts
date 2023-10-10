import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { AuthorizationContext, Rule, AuthorizationHelper } from '@src/modules/authorization';

@Injectable()
export class UserRule implements Rule {
	constructor(
		@Inject(forwardRef(() => AuthorizationHelper)) private readonly authorizationHelper: AuthorizationHelper
	) {}

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
