import { RoleName } from '@modules/role';
import { BaseFactory } from '@testing/factory/base.factory';
import { ObjectId } from 'bson';
import { JwtPayload } from '../domain';

export const jwtPayloadVoFactory = BaseFactory.define<JwtPayload, JwtPayload>(JwtPayload, () => {
	const jwtPayload = {
		accountId: new ObjectId().toHexString(),
		userId: new ObjectId().toHexString(),
		schoolId: new ObjectId().toHexString(),
		roles: [RoleName.ADMINISTRATOR, RoleName.TEACHER],
		support: false,
		systemId: undefined,
		supportUserId: undefined,
		isExternalUser: false,
		aud: 'audience',
		exp: Math.floor(Date.now() / 1000) + 3600,
		iat: Math.floor(Date.now() / 1000),
		iss: 'issuer',
		jti: 'jwt-id-123',
		sub: 'subject',
	};

	return jwtPayload;
});
