import { Permission } from '@shared/domain/interface/permission.enum';
import { Action } from './types/action.enum';
import { AuthorizationContext } from './types/authorization-context.interface';

export class AuthorizationContextBuilder {
	private static build(requiredPermissions: Permission[], action: Action): AuthorizationContext {
		const context = { requiredPermissions, action };

		return context;
	}

	static write(requiredPermissions: Permission[]): AuthorizationContext {
		const context = this.build(requiredPermissions, Action.write);

		return context;
	}

	static read(requiredPermissions: Permission[]): AuthorizationContext {
		const context = this.build(requiredPermissions, Action.read);

		return context;
	}
}
