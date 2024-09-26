import { Instance } from '@modules/instance';
import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import { Action } from '@infra/authorization-client';
import { AuthorizationHelper } from '../service/authorization.helper';
import { AuthorizationContext, Rule } from '../type';

@Injectable()
export class InstanceRule implements Rule<Instance> {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof Instance;

		return isMatched;
	}

	public hasPermission(user: User, entity: Instance, context: AuthorizationContext): boolean {
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);

		// As temporary solution until the user with write access to instance added as group, we must check the role.
		if (context.action === Action.WRITE) {
			const hasRole = this.authorizationHelper.hasRole(user, RoleName.SUPERHERO);

			return hasPermission && hasRole;
		}

		return hasPermission;
	}
}
