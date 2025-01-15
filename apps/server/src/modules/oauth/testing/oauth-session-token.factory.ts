import { ObjectId } from '@mikro-orm/mongodb';
import { DomainObjectFactory } from '@testing/factory/domainobject';
import { JwtTestFactory } from '@testing/factory/jwt.test.factory';
import { OauthSessionToken, OauthSessionTokenProps } from '../domain';

export const oauthSessionTokenFactory = DomainObjectFactory.define<OauthSessionToken, OauthSessionTokenProps>(
	OauthSessionToken,
	() => {
		const expiryTimestampMs = Date.now() + 1000000;

		return {
			id: new ObjectId().toHexString(),
			userId: new ObjectId().toHexString(),
			systemId: new ObjectId().toHexString(),
			refreshToken: JwtTestFactory.createJwt({ exp: expiryTimestampMs / 1000 }),
			expiresAt: new Date(expiryTimestampMs),
		};
	}
);
