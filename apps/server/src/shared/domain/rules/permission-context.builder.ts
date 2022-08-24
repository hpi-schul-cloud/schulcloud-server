import { IPermissionContext } from '../interface';
import { Permission } from '../interface/permission.enum';
import { Actions } from './actions.enum';

export default class PermissionContextBuilder {
	private static build(requiredPermissions: Permission[], action: Actions): IPermissionContext {
		const context = { requiredPermissions, action };

		return context;
	}

	static write(requiredPermissions: Permission[]): IPermissionContext {
		const context = this.build(requiredPermissions, Actions.write);

		return context;
	}

	static read(requiredPermissions: Permission[]): IPermissionContext {
		const context = this.build(requiredPermissions, Actions.read);

		return context;
	}
}
