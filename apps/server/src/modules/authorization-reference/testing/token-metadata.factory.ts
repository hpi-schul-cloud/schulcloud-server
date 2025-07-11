import { AuthorizableReferenceType } from '@modules/authorization';
import { BaseFactory } from '@testing/factory/base.factory';
import { ObjectId } from 'bson';
import { TokenMetadata } from '../domain';
import { authorizationContextFactory } from './authorization-context.factory';

export const tokenMetadataFactory = BaseFactory.define<TokenMetadata, TokenMetadata>(TokenMetadata, ({}) => {
	const tokenMetadata = {
		authorizationContext: authorizationContextFactory.build(),
		referenceType: AuthorizableReferenceType.School,
		referenceId: new ObjectId().toHexString(),
		userId: new ObjectId().toHexString(),
		customPayload: { foo: 'bar' },
	};

	return tokenMetadata;
});
