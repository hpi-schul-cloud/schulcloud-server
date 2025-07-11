import { Action } from '@modules/authorization';
import { Permission } from '@shared/domain/interface';
import { BaseFactory } from '@testing/factory/base.factory';
import { AuthorizationContextVO } from '../domain';

export const authorizationContextFactory = BaseFactory.define<AuthorizationContextVO, AuthorizationContextVO>(
	AuthorizationContextVO,
	({}) => {
		const authorizationContext = {
			action: Action.read,
			requiredPermissions: [Permission.ACCOUNT_CREATE],
		};

		return authorizationContext;
	}
);
