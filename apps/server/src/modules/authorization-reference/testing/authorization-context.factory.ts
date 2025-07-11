import { Action } from '@modules/authorization';
import { Permission } from '@shared/domain/interface';
import { BaseFactory } from '@testing/factory/base.factory';
import { AuthorizationContext } from '../domain';

export const authorizationContextFactory = BaseFactory.define<AuthorizationContext, AuthorizationContext>(
	AuthorizationContext,
	({}) => {
		const authorizationContext = {
			action: Action.read,
			requiredPermissions: [Permission.ACCOUNT_CREATE],
		};

		return authorizationContext;
	}
);
