import { Injectable } from '@nestjs/common';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { AuthorizationContext, Rule } from '@src/modules/authorization/types';
import { UserLoginMigrationDO } from '../domainobject';
import { User } from '../entity';

@Injectable()
export class UserLoginMigrationRule implements Rule<UserLoginMigrationDO> {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, entity: UserLoginMigrationDO): boolean {
		const isMatched: boolean = entity instanceof UserLoginMigrationDO;

		return isMatched;
	}

	public hasPermission(user: User, entity: UserLoginMigrationDO, context: AuthorizationContext): boolean {
		const hasPermission: boolean =
			this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) &&
			user.school.id === entity.schoolId;

		return hasPermission;
	}
}
