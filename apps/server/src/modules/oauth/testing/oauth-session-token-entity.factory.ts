import { BaseFactory, JwtTestFactory, systemEntityFactory, userFactory } from '@shared/testing';
import { OauthSessionTokenEntity, OauthSessionTokenEntityProps } from '../entity';

export const oauthSessionTokenEntityFactory = BaseFactory.define<OauthSessionTokenEntity, OauthSessionTokenEntityProps>(
	OauthSessionTokenEntity,
	() => {
		return {
			user: userFactory.build(),
			system: systemEntityFactory.build(),
			refreshToken: JwtTestFactory.createJwt({ exp: Date.now() + 10000 }),
			expiresAt: new Date(Date.now() + 10000),
		};
	}
);
