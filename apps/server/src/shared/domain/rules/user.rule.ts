import { Injectable } from '@nestjs/common';
import { User } from '../entity';
import { AuthorizationContext } from '../interface/permission';
import { BasePermission } from './base-permission';

@Injectable()
export class UserRule extends BasePermission<User> {
	public isApplicable(user: User, entity: User): boolean {
		const isMatched = entity instanceof User;

		return isMatched;
	}

	public hasPermission(user: User, entity: User, context: AuthorizationContext): boolean {
		const hasPermission = this.utils.hasAllPermissions(user, context.requiredPermissions);
		const isOwner = user === entity;

		return hasPermission || isOwner;
	}
}
