import { AuthorizableReferenceType } from '@modules/authorization';
import { authorizationContextFactory } from '@modules/authorization/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { ObjectId } from 'bson';
import { TokenMetadata } from '../domain';

export const tokenMetadataTestFactory = BaseFactory.define<TokenMetadata, TokenMetadata>(TokenMetadata, () => {
	const tokenMetadata = {
		authorizationContext: authorizationContextFactory.build(),
		referenceType: AuthorizableReferenceType.School,
		referenceId: new ObjectId().toHexString(),
		userId: new ObjectId().toHexString(),
		accountId: new ObjectId().toHexString(),
		jwtJti: 'jti-12345',
		customPayload: { foo: 'bar' },
	};

	return tokenMetadata;
});
