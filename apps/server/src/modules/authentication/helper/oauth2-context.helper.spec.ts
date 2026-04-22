import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Account, AccountService } from '@modules/account';
import { accountDoFactory } from '@modules/account/testing';
import { OAuthService, OauthSessionTokenService } from '@modules/oauth';
import { userDoFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from '../authentication-config';
import { Oauth2AuthorizationBodyParams } from '../controllers/dto';
import {
	AccountNotFoundLoggableException,
	MissingRefreshTokenLoggableException,
	SchoolInMigrationLoggableException,
	UserAccountDeactivatedLoggableException,
} from '../loggable';
import { Oauth2ContextHelper, Oauth2ContextResult } from './oauth2-context.helper';

describe(Oauth2ContextHelper.name, () => {
	let module: TestingModule;
	let helper: Oauth2ContextHelper;
	let accountService: DeepMocked<AccountService>;
	let oauthService: DeepMocked<OAuthService>;
	let oauthSessionTokenService: DeepMocked<OauthSessionTokenService>;
	let config: AuthenticationConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				Oauth2ContextHelper,
				{
					provide: OAuthService,
					useValue: createMock<OAuthService>(),
				},
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
				{
					provide: OauthSessionTokenService,
					useValue: createMock<OauthSessionTokenService>(),
				},
				{
					provide: AUTHENTICATION_CONFIG_TOKEN,
					useValue: new AuthenticationConfig(),
				},
			],
		}).compile();

		helper = module.get(Oauth2ContextHelper);
		accountService = module.get(AccountService);
		oauthService = module.get(OAuthService);
		oauthSessionTokenService = module.get(OauthSessionTokenService);
		config = module.get(AUTHENTICATION_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('buildOauth2Context', () => {
		describe('when user could not be provisioned', () => {
			const setup = () => {
				const systemId = 'systemId';
				oauthService.authenticateUser.mockResolvedValue({
					idToken: 'idToken',
					accessToken: 'accessToken',
					refreshToken: 'refreshToken',
				});
				oauthService.provisionUser.mockResolvedValue(
					undefined as unknown as ReturnType<typeof userDoFactory.buildWithId>
				);
				config.externalSystemLogoutEnabled = false;

				const params: Oauth2AuthorizationBodyParams = {
					code: 'code',
					redirectUri: 'redirectUri',
					systemId,
				};

				return { params };
			};

			it('should throw SchoolInMigrationLoggableException', async () => {
				const { params } = setup();

				const func = () => helper.buildOauth2Context(params);

				await expect(func).rejects.toThrow(new SchoolInMigrationLoggableException());
			});
		});

		describe('when account is not found', () => {
			const setup = () => {
				const systemId = 'systemId';
				const user = userDoFactory.buildWithId();

				oauthService.authenticateUser.mockResolvedValue({
					idToken: 'idToken',
					accessToken: 'accessToken',
					refreshToken: 'refreshToken',
				});
				oauthService.provisionUser.mockResolvedValue(user);
				accountService.findByUserId.mockResolvedValue(undefined as unknown as Account);
				config.externalSystemLogoutEnabled = false;

				const params: Oauth2AuthorizationBodyParams = {
					code: 'code',
					redirectUri: 'redirectUri',
					systemId,
				};

				return { params };
			};

			it('should throw AccountNotFoundLoggableException', async () => {
				const { params } = setup();

				const func = () => helper.buildOauth2Context(params);

				await expect(func).rejects.toThrow(new AccountNotFoundLoggableException());
			});
		});

		describe('when account is deactivated', () => {
			const setup = () => {
				const systemId = 'systemId';
				const user = userDoFactory.buildWithId();
				const account = accountDoFactory.build() as Account & { deactivatedAt?: Date };
				account.deactivatedAt = new Date(Date.now() - 1000);

				oauthService.authenticateUser.mockResolvedValue({
					idToken: 'idToken',
					accessToken: 'accessToken',
					refreshToken: 'refreshToken',
				});
				oauthService.provisionUser.mockResolvedValue(user);
				accountService.findByUserId.mockResolvedValue(account);
				config.externalSystemLogoutEnabled = false;

				const params: Oauth2AuthorizationBodyParams = {
					code: 'code',
					redirectUri: 'redirectUri',
					systemId,
				};

				return { params };
			};

			it('should throw UserAccountDeactivatedLoggableException', async () => {
				const { params } = setup();

				const func = () => helper.buildOauth2Context(params);

				await expect(func).rejects.toThrow(new UserAccountDeactivatedLoggableException());
			});
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

				const func = () => helper.buildOauth2Context(params);

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

				const func = () => helper.buildOauth2Context(params);

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

				const result: Oauth2ContextResult = await helper.buildOauth2Context(params);

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

		describe('when externalSystemLogoutEnabled is true and refreshToken is present', () => {
			const setup = () => {
				const systemId = 'systemId';
				const user = userDoFactory.buildWithId();
				const account: Account = accountDoFactory.build();
				const refreshToken = jwt.sign({ exp: Math.floor(Date.now() / 1000) + 3600 }, 'secret');

				oauthService.authenticateUser.mockResolvedValue({
					idToken: 'idToken',
					accessToken: 'accessToken',
					refreshToken,
				});
				oauthService.provisionUser.mockResolvedValue(user);
				accountService.findByUserId.mockResolvedValue(account);
				config.externalSystemLogoutEnabled = true;

				const params: Oauth2AuthorizationBodyParams = {
					code: 'code',
					redirectUri: 'redirectUri',
					systemId,
				};

				return { params, user, account, systemId, refreshToken };
			};

			it('should save an oauth session token and return the context', async () => {
				const { params, user, account, systemId, refreshToken } = setup();

				const result: Oauth2ContextResult = await helper.buildOauth2Context(params);

				expect(result).toEqual({
					user,
					account,
					tokenDto: {
						idToken: 'idToken',
						accessToken: 'accessToken',
						refreshToken,
					},
					systemId,
				});

				expect(oauthSessionTokenService.save).toHaveBeenCalledTimes(1);
				const [oauthSessionToken] = oauthSessionTokenService.save.mock.calls[0];
				expect(oauthSessionToken).toEqual(
					expect.objectContaining({
						userId: user.id,
						systemId,
						refreshToken,
					})
				);
			});
		});
	});
});
