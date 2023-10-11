import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { UserLoginMigrationDO } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { AuthorizationContext, Rule } from '../../../types';
import { AuthorizationHelper } from '../authorization.helper';

@Injectable()
export class UserLoginMigrationRule implements Rule<UserLoginMigrationDO> {
	constructor(
		@Inject(forwardRef(() => AuthorizationHelper)) private readonly authorizationHelper: AuthorizationHelper
	) {}

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
