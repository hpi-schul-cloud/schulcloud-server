import { Injectable } from '@nestjs/common';
import { User } from '../entity';
import { IAuthorizationContext } from '../interface/rule';
import { BaseRule } from './base-rule';

@Injectable()
export class UserRule extends BaseRule<User> {
	public isApplicable(user: User, entity: User): boolean {
		const isMatched = entity instanceof User;

		return isMatched;
	}

	public hasPermission(user: User, entity: User, context: IAuthorizationContext): boolean {
		const hasPermission = this.utils.hasAllPermissions(user, context.requiredPermissions);
		const isOwner = user === entity;

		return hasPermission || isOwner;
	}
}
