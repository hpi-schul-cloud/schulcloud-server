import { Action, AuthorizableReferenceType } from '@modules/authorization';
import { Permission } from '@shared/domain/interface';
import { BaseFactory } from '@testing/factory/base.factory';
import { ObjectId } from 'bson';
import { CreateAccessTokenParams } from '../api/dto';
import { authorizationContextFactory } from './authorization-context.factory';

export const createAccessTokenParamsFactory = BaseFactory.define<CreateAccessTokenParams, CreateAccessTokenParams>(
	CreateAccessTokenParams,
	() => {
		const createAccessTokenParams = {
			action: Action.read,
			requiredPermissions: [Permission.ACCOUNT_CREATE],
			referenceType: AuthorizableReferenceType.School,
			referenceId: new ObjectId().toHexString(),
			tokenTtl: 3600,
			payload: { foo: 'bar' },
			userId: 'user-id-123',
			context: authorizationContextFactory.build(),
		};

		return createAccessTokenParams;
	}
);
