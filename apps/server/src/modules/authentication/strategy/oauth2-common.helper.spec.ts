import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Account, AccountService } from '@modules/account';
import { accountDoFactory } from '@modules/account/testing';
import { OAuthService, OauthSessionTokenService } from '@modules/oauth';
import { userDoFactory } from '@modules/user/testing';
import { AuthenticationConfig } from '../authentication-config';
import { MissingRefreshTokenLoggableException } from '../loggable';
import { Oauth2AuthorizationBodyParams } from '../controllers/dto';
import { buildOauth2Context } from './oauth2-common.helper';

describe('buildOauth2Context', () => {
	let accountService: DeepMocked<AccountService>;
	let oauthService: DeepMocked<OAuthService>;
	let oauthSessionTokenService: DeepMocked<OauthSessionTokenService>;
	let config: AuthenticationConfig;

	beforeEach(() => {
		accountService = createMock<AccountService>();
		oauthService = createMock<OAuthService>();
		oauthSessionTokenService = createMock<OauthSessionTokenService>();
		config = new AuthenticationConfig();
	});

	describe('when externalSystemLogoutEnabled is true and refreshToken is missing', () => {
		const setup = () => {
			const systemId = 'systemId';
			const user = userDoFactory.buildWithId();
			const account = accountDoFactory.build();

			oauthService.authenticateUser.mockResolvedValue({
				idToken: 'idToken',
				accessToken: 'accessToken',
				refreshToken: undefined as unknown as string,
			});
			oauthService.provisionUser.mockResolvedValue(user);
			accountService.findByUserId.mockResolvedValue(account);
			config.externalSystemLogoutEnabled = true;

			const params: Oauth2AuthorizationBodyParams = {
				code: 'code',
				redirectUri: 'redirectUri',
				systemId,
			};

			return { params, systemId };
		};

		it('should throw MissingRefreshTokenLoggableException', async () => {
			const { params, systemId } = setup();

			const func = () => buildOauth2Context(params, oauthService, accountService, oauthSessionTokenService, config);

			await expect(func).rejects.toThrow(new MissingRefreshTokenLoggableException(systemId));
		});
	});

	describe('when externalSystemLogoutEnabled is true and refreshToken is empty string', () => {
		const setup = () => {
			const systemId = 'systemId';
			const user = userDoFactory.buildWithId();
			const account = accountDoFactory.build();

			oauthService.authenticateUser.mockResolvedValue({
				idToken: 'idToken',
				accessToken: 'accessToken',
				refreshToken: '',
			});
			oauthService.provisionUser.mockResolvedValue(user);
			accountService.findByUserId.mockResolvedValue(account);
			config.externalSystemLogoutEnabled = true;

			const params: Oauth2AuthorizationBodyParams = {
				code: 'code',
				redirectUri: 'redirectUri',
				systemId,
			};

			return { params, systemId };
		};

		it('should throw MissingRefreshTokenLoggableException', async () => {
			const { params, systemId } = setup();

			const func = () => buildOauth2Context(params, oauthService, accountService, oauthSessionTokenService, config);

			await expect(func).rejects.toThrow(new MissingRefreshTokenLoggableException(systemId));
		});
	});

	describe('when externalSystemLogoutEnabled is false and refreshToken is missing', () => {
		const setup = () => {
			const systemId = 'systemId';
			const user = userDoFactory.buildWithId();
			const account: Account = accountDoFactory.build();

			oauthService.authenticateUser.mockResolvedValue({
				idToken: 'idToken',
				accessToken: 'accessToken',
				refreshToken: undefined as unknown as string,
			});
			oauthService.provisionUser.mockResolvedValue(user);
			accountService.findByUserId.mockResolvedValue(account);
			config.externalSystemLogoutEnabled = false;

			const params: Oauth2AuthorizationBodyParams = {
				code: 'code',
				redirectUri: 'redirectUri',
				systemId,
			};

			return { params, user, account };
		};

		it('should not throw and return the context', async () => {
			const { params, user, account } = setup();

			const result = await buildOauth2Context(params, oauthService, accountService, oauthSessionTokenService, config);

			expect(result).toEqual({
				user,
				account,
				tokenDto: {
					idToken: 'idToken',
					accessToken: 'accessToken',
					refreshToken: undefined,
				},
				systemId: params.systemId,
			});
		});
	});
});
