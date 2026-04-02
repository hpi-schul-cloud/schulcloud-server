import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Account, AccountService } from '@modules/account';
import { accountDoFactory } from '@modules/account/testing';
import { OAuthService, OauthSessionTokenService } from '@modules/oauth';
import { userDoFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from '../authentication-config';
import { MissingRefreshTokenLoggableException } from '../loggable';
import { Oauth2AuthorizationBodyParams } from '../controllers/dto';
import { Oauth2ContextHelper } from './oauth2-context.helper';

describe(Oauth2ContextHelper.name, () => {
	let module: TestingModule;
	let helper: Oauth2ContextHelper;
	let accountService: DeepMocked<AccountService>;
	let oauthService: DeepMocked<OAuthService>;
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
		config = module.get(AUTHENTICATION_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('buildOauth2Context', () => {
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

				const result = await helper.buildOauth2Context(params);

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
});
