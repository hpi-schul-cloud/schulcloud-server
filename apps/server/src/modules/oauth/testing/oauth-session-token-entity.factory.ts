import { systemEntityFactory } from '@modules/system/testing';
import { userFactory } from '@modules/user/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { JwtTestFactory } from '@testing/factory/jwt.test.factory';
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
