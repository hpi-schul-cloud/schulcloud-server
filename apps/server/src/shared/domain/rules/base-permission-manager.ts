import { User } from '../entity/user.entity';
import { Rule, AuthorizationContext, AuthorizableObject } from '../interface';
import { BasePermission } from './base-permission';
import { AuthorisationUtils } from './authorisation.utils';
import { SingleSelectStrategie } from './select-strategies';

export abstract class BasePermissionManager extends AuthorisationUtils implements Rule {
	protected permissions: BasePermission[] = [];

	protected selectStrategie = new SingleSelectStrategie<BasePermission>();

	private selectPermissions(user: User, entity: AuthorizableObject, context?: AuthorizationContext): BasePermission[] {
		return this.permissions.filter((publisher) => publisher.isApplicable(user, entity, context));
	}

	protected registerPermissions(permissions: BasePermission[]): void {
		this.permissions = [...this.permissions, ...permissions];
	}

	hasPermission(user: User, entity: AuthorizableObject, context: AuthorizationContext) {
		const permissions = this.selectPermissions(user, entity, context);
		const permission = this.selectStrategie.match(permissions);

		return permission.hasPermission(user, entity, context);
	}
}
