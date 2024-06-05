import { Injectable } from '@nestjs/common';
import { UserLoginMigrationDO } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { AuthorizationHelper } from '../service/authorization.helper';
import { AuthorizationContext, Rule } from '../type';

@Injectable()
export class UserLoginMigrationRule implements Rule<UserLoginMigrationDO> {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched: boolean = object instanceof UserLoginMigrationDO;

		return isMatched;
	}

	public hasPermission(user: User, entity: UserLoginMigrationDO, context: AuthorizationContext): boolean {
		const hasPermission: boolean =
			this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions) &&
			user.school.id === entity.schoolId;

		return hasPermission;
	}
}
