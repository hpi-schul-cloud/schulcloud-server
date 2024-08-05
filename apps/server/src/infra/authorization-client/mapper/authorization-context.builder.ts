import { Permission } from '@shared/domain/interface';
import { Action, AuthorizationContextParams } from '../authorization-api-client';

export class AuthorizationContextBuilder {
	static build(requiredPermissions: Array<Permission>, action: Action): AuthorizationContextParams {
		return {
			action,
			requiredPermissions,
		};
	}

	static write(requiredPermissions: Permission[]): AuthorizationContextParams {
		const context = this.build(requiredPermissions, Action.WRITE);

		return context;
	}

	static read(requiredPermissions: Permission[]): AuthorizationContextParams {
		const context = this.build(requiredPermissions, Action.READ);

		return context;
	}
}
