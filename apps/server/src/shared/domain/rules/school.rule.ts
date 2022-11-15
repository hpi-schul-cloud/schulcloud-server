import { Injectable } from '@nestjs/common';
import { School, User } from '../entity';
import { IAuthorizationContext } from '../interface/rule';
import { BaseRule } from './base-rule';

@Injectable()
export class SchoolRule extends BaseRule<School> {
	public isApplicable(user: User, entity: School): boolean {
		const isMatched = entity instanceof School;

		return isMatched;
	}

	public hasPermission(user: User, entity: School, context: IAuthorizationContext): boolean {
		const hasPermission = this.utils.hasAllPermissions(user, context.requiredPermissions) && user.school === entity;

		return hasPermission;
	}
}
