import { Injectable } from '@nestjs/common';
import { User } from '../../../shared/domain/entity';
import { AuthorizationHelper } from '../authorization.helper';
import { AuthorizationContext } from '../types';

@Injectable()
export class UserRule {
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
