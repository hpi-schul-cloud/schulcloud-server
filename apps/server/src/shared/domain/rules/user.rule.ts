import { Injectable } from '@nestjs/common';
import { User } from '../entity';
import { AuthorizationContext } from '../interface/permission';
import { AuthorizationHelper } from './authorization.helper';

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
