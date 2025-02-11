import type { Permission } from '@shared/domain/interface';
import { Action, type AuthorizationContext } from '../type';

export class AuthorizationContextBuilder {
	private static build(requiredPermissions: Permission[], action: Action): AuthorizationContext {
		const context = { requiredPermissions, action };

		return context;
	}

	public static write(requiredPermissions: Permission[]): AuthorizationContext {
		const context = this.build(requiredPermissions, Action.write);

		return context;
	}

	public static read(requiredPermissions: Permission[]): AuthorizationContext {
		const context = this.build(requiredPermissions, Action.read);

		return context;
	}
}
