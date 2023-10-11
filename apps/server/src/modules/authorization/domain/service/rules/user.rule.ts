import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { AuthorizationContext, Rule } from '../../../types';
import { AuthorizationHelper } from '../authorization.helper';

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
