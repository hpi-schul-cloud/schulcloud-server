import { systemEntityFactory } from '@modules/system/testing';
import { userFactory } from '@modules/user/testing';
import { AesEncryptionHelper } from '@shared/common/utils';
import { BaseFactory } from '@testing/factory/base.factory';
import { JwtTestFactory } from '@testing/factory/jwt.test.factory';
import { OauthSessionTokenEntity, type OauthSessionTokenEntityProps } from '../entity';

export const oauthSessionTokenEntityFactory = BaseFactory.define<OauthSessionTokenEntity, OauthSessionTokenEntityProps>(
	OauthSessionTokenEntity,
	() => {
		return {
			user: userFactory.build(),
			system: systemEntityFactory.build(),
			refreshToken: AesEncryptionHelper.encrypt(
				JwtTestFactory.createJwt({ exp: Date.now() + 10000 }),
				'randomStringWithAtLeast16Chars;'
			),
			expiresAt: new Date(Date.now() + 10000),
		};
	}
);
