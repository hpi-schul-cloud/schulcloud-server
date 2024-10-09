import { ObjectId } from '@mikro-orm/mongodb';
import { DomainObjectFactory, JwtTestFactory } from '@shared/testing';
import { OauthSessionToken, OauthSessionTokenProps } from '../domain';

export const oauthSessionTokenFactory = DomainObjectFactory.define<OauthSessionToken, OauthSessionTokenProps>(
	OauthSessionToken,
	() => {
		return {
			id: new ObjectId().toHexString(),
			userId: new ObjectId().toHexString(),
			systemId: new ObjectId().toHexString(),
			refreshToken: JwtTestFactory.createJwt({ exp: Date.now() + 10000 }),
			expiresAt: new Date(Date.now() + 10000),
		};
	}
);
