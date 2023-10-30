import { Injectable } from '@nestjs/common';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { AuthorizationContext } from '@src/modules/authorization/types/authorization-context.interface';
import { Rule } from '@src/modules/authorization/types/rule.interface';
import { UserLoginMigrationDO } from '../domainobject/user-login-migration.do';
import { User } from '../entity/user.entity';

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
