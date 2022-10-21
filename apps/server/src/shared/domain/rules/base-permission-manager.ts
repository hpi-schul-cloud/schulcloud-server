import { User } from '../entity/user.entity';
import { IPermission, IPermissionContext, PermissionTypes } from '../interface';
import { BasePermission } from './base-permission';
import { AuthorisationUtils } from './authorisation.utils';
import { SingleSelectStrategie } from './select-strategies';

export abstract class BasePermissionManager extends AuthorisationUtils implements IPermission {
	protected permissions: BasePermission[] = [];

	protected selectStrategie = new SingleSelectStrategie<BasePermission>();

	private selectPermissions(user: User, entity: PermissionTypes, context?: IPermissionContext): BasePermission[] {
		return this.permissions.filter((publisher) => publisher.isApplicable(user, entity, context));
	}

	protected registerPermissions(permissions: BasePermission[]): void {
		this.permissions = [...this.permissions, ...permissions];
	}

	hasPermission(user: User, entity: PermissionTypes, context: IPermissionContext): boolean {
		const permissions = this.selectPermissions(user, entity, context);
		const permission = this.selectStrategie.match(permissions);

		return permission.hasPermission(user, entity, context);
	}
}
