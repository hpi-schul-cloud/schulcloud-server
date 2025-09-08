import { ObjectId } from '@mikro-orm/mongodb';
import { JwtTestFactory } from '@testing/factory/jwt.test.factory';
import { TokenInvalidLoggableException } from '../../loggable';
import { OauthSessionToken } from './oauth-session-token';
import { OauthSessionTokenFactory } from './oauth-session-token.factory';

describe(OauthSessionTokenFactory.name, () => {
	describe('build', () => {
		describe('when the refresh token is valid', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const expiryDate = new Date();
				const refreshToken = JwtTestFactory.createJwt({ exp: expiryDate.getTime() / 1000 });

				return {
					userId,
					systemId,
					expiryDate,
					refreshToken,
				};
			};

			it('should create the token object', () => {
				const { userId, systemId, expiryDate, refreshToken } = setup();

				const result = OauthSessionTokenFactory.build({
					userId,
					systemId,
					refreshToken,
				});

				expect(result).toEqual(
					new OauthSessionToken({
						id: expect.any(String),
						systemId,
						userId,
						refreshToken,
						expiresAt: expiryDate,
					})
				);
			});
		});

		describe('when the refresh token is invalid', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const systemId = new ObjectId().toHexString();
				const refreshToken = 'invalidOidcToken';

				return {
					userId,
					systemId,
					refreshToken,
				};
			};

			it('should create the token object', () => {
				const { userId, systemId, refreshToken } = setup();

				expect(() =>
					OauthSessionTokenFactory.build({
						userId,
						systemId,
						refreshToken,
					})
				).toThrow(TokenInvalidLoggableException);
			});
		});
	});
});
