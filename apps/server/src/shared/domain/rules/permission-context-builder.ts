import { IPermissionContext } from '../interface';
import { Actions } from './actions.enum';
import { Permission } from '../interface/permission.enum';

class Builder {
	build(requiredPermissions: Permission[], action?: Actions): IPermissionContext {
		const context = { requiredPermissions, action };

		return context;
	}

	write(requiredPermissions: Permission[]): IPermissionContext {
		const context = this.build(requiredPermissions, Actions.write);

		return context;
	}

	read(requiredPermissions: Permission[]): IPermissionContext {
		const context = this.build(requiredPermissions, Actions.read);

		return context;
	}

	permissionOnly(requiredPermissions: Permission[]): IPermissionContext {
		const context = this.build(requiredPermissions, undefined);

		return context;
	}
}

const PermissionContextBuilder = new Builder();

export default PermissionContextBuilder;
