import { IAuthorizationContext } from '../interface';
import { Permission } from '../interface/permission.enum';
import { Actions } from './actions.enum';

export class AuthorizationContextBuilder {
	private static build(requiredPermissions: Permission[], action: Actions): IAuthorizationContext {
		const context = { requiredPermissions, action };

		return context;
	}

	// TODO: The names of these methods are not good
	static write(requiredPermissions: Permission[]): IAuthorizationContext {
		const context = this.build(requiredPermissions, Actions.write);

		return context;
	}

	static read(requiredPermissions: Permission[]): IAuthorizationContext {
		const context = this.build(requiredPermissions, Actions.read);

		return context;
	}
}
