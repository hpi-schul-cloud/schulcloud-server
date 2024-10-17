import {
	AuthorizationContextParams,
	AuthorizationContextParamsAction,
	AuthorizationContextParamsRequiredPermissions,
} from '../authorization-api-client';

export class AuthorizationContextBuilder {
	static build(
		requiredPermissions: Array<AuthorizationContextParamsRequiredPermissions>,
		action: AuthorizationContextParamsAction
	): AuthorizationContextParams {
		return {
			action,
			requiredPermissions,
		};
	}

	static write(requiredPermissions: AuthorizationContextParamsRequiredPermissions[]): AuthorizationContextParams {
		const context = this.build(requiredPermissions, AuthorizationContextParamsAction.WRITE);

		return context;
	}

	static read(requiredPermissions: AuthorizationContextParamsRequiredPermissions[]): AuthorizationContextParams {
		const context = this.build(requiredPermissions, AuthorizationContextParamsAction.READ);

		return context;
	}
}
