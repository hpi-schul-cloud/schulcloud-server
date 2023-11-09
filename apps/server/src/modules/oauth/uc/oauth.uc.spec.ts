import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OauthCurrentUser } from '@modules/authentication/interface';
import { AuthenticationService } from '@modules/authentication/services/authentication.service';
import { LegacySchoolService } from '@modules/legacy-school';
import { OauthUc } from '@modules/oauth/uc/oauth.uc';
import { SystemService } from '@modules/system';
import { OauthConfigDto, SystemDto } from '@modules/system/service';
import { UserService } from '@modules/user';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO } from '@shared/domain';
import { ISession } from '@shared/domain/types/session';
import { setupEntities } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { OAuthTokenDto } from '../interface';
import { OAuthSSOError } from '../loggable';
import { OAuthProcessDto } from '../service/dto';
import { OAuthService } from '../service/oauth.service';
import { OauthLoginStateDto } from './dto/oauth-login-state.dto';
import resetAllMocks = jest.resetAllMocks;

jest.mock('nanoid', () => {
	return {
		nanoid: () => 'mockNanoId',
	};
});

describe(OauthUc.name, () => {
	let module: TestingModule;
	let uc: OauthUc;

	let authenticationService: DeepMocked<AuthenticationService>;
	let oauthService: DeepMocked<OAuthService>;
	let systemService: DeepMocked<SystemService>;
	let userService: DeepMocked<UserService>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				OauthUc,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: OAuthService,
					useValue: createMock<OAuthService>(),
				},
				{
					provide: AuthenticationService,
					useValue: createMock<AuthenticationService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
				{
					provide: AuthenticationService,
					useValue: createMock<AuthenticationService>(),
				},
			],
		}).compile();

		uc = module.get(OauthUc);
		systemService = module.get(SystemService);
		authenticationService = module.get(AuthenticationService);
		oauthService = module.get(OAuthService);
		userService = module.get(UserService);
		authenticationService = module.get(AuthenticationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		resetAllMocks();
	});

	const createOAuthTestData = () => {
		const oauthConfig: OauthConfigDto = new OauthConfigDto({
			clientId: '12345',
			clientSecret: 'mocksecret',
			tokenEndpoint: 'https://mock.de/mock/auth/public/mockToken',
			grantType: 'authorization_code',
			scope: 'openid uuid',
			responseType: 'code',
			authEndpoint: 'mock_authEndpoint',
			provider: 'mock_provider',
			logoutEndpoint: 'mock_logoutEndpoint',
			issuer: 'mock_issuer',
			jwksEndpoint: 'mock_jwksEndpoint',
			redirectUri: 'mock_codeRedirectUri',
		});
		const system: SystemDto = new SystemDto({
			id: 'systemId',
			type: 'oauth',
			oauthConfig,
		});

		return {
			system,
			systemId: system.id as string,
			oauthConfig,
		};
	};

	describe('startOauthLogin', () => {
		describe('when starting an oauth login without migration', () => {
			const setup = () => {
				const { system, systemId } = createOAuthTestData();

				const session: DeepMocked<ISession> = createMock<ISession>();
				const authenticationUrl = 'authenticationUrl';

				systemService.findById.mockResolvedValue(system);
				oauthService.getAuthenticationUrl.mockReturnValue(authenticationUrl);

				return {
					systemId,
					session,
					authenticationUrl,
				};
			};

			it('should return the authentication url for the system', async () => {
				const { systemId, session, authenticationUrl } = setup();

				const result: string = await uc.startOauthLogin(session, systemId, false);

				expect(result).toEqual(authenticationUrl);
			});
		});

		describe('when starting an oauth login during a migration', () => {
			const setup = () => {
				const { system, systemId } = createOAuthTestData();

				const session: DeepMocked<ISession> = createMock<ISession>();
				const authenticationUrl = 'authenticationUrl';
				const postLoginRedirect = 'postLoginRedirect';

				systemService.findById.mockResolvedValue(system);
				oauthService.getAuthenticationUrl.mockReturnValue(authenticationUrl);

				return {
					system,
					systemId,
					postLoginRedirect,
					session,
				};
			};

			it('should save data to the session', async () => {
				const { systemId, system, session, postLoginRedirect } = setup();

				await uc.startOauthLogin(session, systemId, false, postLoginRedirect);

				expect(session.oauthLoginState).toEqual<OauthLoginStateDto>({
					systemId,
					state: 'mockNanoId',
					postLoginRedirect,
					provider: system.oauthConfig?.provider as string,
					userLoginMigration: false,
				});
			});
		});

		describe('when the system cannot be found', () => {
			const setup = () => {
				const { systemId, system } = createOAuthTestData();
				system.oauthConfig = undefined;
				const session: DeepMocked<ISession> = createMock<ISession>();
				const authenticationUrl = 'authenticationUrl';

				systemService.findById.mockResolvedValue(system);
				oauthService.getAuthenticationUrl.mockReturnValue(authenticationUrl);

				return {
					systemId,
					session,
					authenticationUrl,
				};
			};

			it('should throw UnprocessableEntityException', async () => {
				const { systemId, session } = setup();

				const func = async () => uc.startOauthLogin(session, systemId, false);

				await expect(func).rejects.toThrow(UnprocessableEntityException);
			});
		});
	});

	describe('processOAuth', () => {
		const setup = () => {
			const postLoginRedirect = 'postLoginRedirect';
			const cachedState: OauthLoginStateDto = new OauthLoginStateDto({
				state: 'state',
				systemId: 'systemId',
				postLoginRedirect,
				provider: 'mock_provider',
				userLoginMigration: false,
			});
			const code = 'code';
			const error = 'error';

			const jwt = 'schulcloudJwt';
			const redirect = 'redirect';
			const user: UserDO = new UserDO({
				id: 'mockUserId',
				firstName: 'firstName',
				lastName: 'lastame',
				email: '',
				roles: [],
				schoolId: 'mockSchoolId',
				externalId: 'mockExternalId',
			});

			const currentUser: OauthCurrentUser = { userId: 'userId', isExternalUser: true } as OauthCurrentUser;
			const testSystem: SystemDto = new SystemDto({
				id: 'mockSystemId',
				type: 'mock',
				oauthConfig: { provider: 'testProvider' } as OauthConfigDto,
			});
			const tokenDto: OAuthTokenDto = new OAuthTokenDto({
				idToken: 'idToken',
				refreshToken: 'refreshToken',
				accessToken: 'accessToken',
			});

			return { cachedState, code, error, jwt, redirect, user, currentUser, testSystem, tokenDto };
		};

		describe('when a user is returned', () => {
			it('should return a response with a valid jwt', async () => {
				const { cachedState, code, error, jwt, redirect, user, currentUser, tokenDto } = setup();

				userService.getResolvedUser.mockResolvedValue(currentUser);
				authenticationService.generateJwt.mockResolvedValue({ accessToken: jwt });
				oauthService.authenticateUser.mockResolvedValue(tokenDto);
				oauthService.provisionUser.mockResolvedValue({ user, redirect });

				const response: OAuthProcessDto = await uc.processOAuthLogin(cachedState, code, error);
				expect(response).toEqual(
					expect.objectContaining({
						jwt,
						redirect,
					})
				);
			});
		});

		describe('when no user is returned', () => {
			it('should return a response without a jwt', async () => {
				const { cachedState, code, error, redirect, tokenDto } = setup();
				oauthService.authenticateUser.mockResolvedValue(tokenDto);
				oauthService.provisionUser.mockResolvedValue({ redirect });

				const response: OAuthProcessDto = await uc.processOAuthLogin(cachedState, code, error);

				expect(response).toEqual<OAuthProcessDto>({
					redirect,
				});
			});
		});

		describe('when an error occurs', () => {
			it('should return an OAuthProcessDto with error', async () => {
				const { cachedState, code, error, testSystem } = setup();
				oauthService.authenticateUser.mockRejectedValue(new OAuthSSOError('Testmessage'));
				systemService.findById.mockResolvedValue(testSystem);

				const response = uc.processOAuthLogin(cachedState, code, error);

				await expect(response).rejects.toThrow(OAuthSSOError);
			});
		});

		describe('when the process runs successfully', () => {
			it('should return a valid jwt', async () => {
				const { cachedState, code, user, currentUser, jwt, redirect, tokenDto } = setup();

				userService.getResolvedUser.mockResolvedValue(currentUser);
				authenticationService.generateJwt.mockResolvedValue({ accessToken: jwt });
				oauthService.authenticateUser.mockResolvedValue(tokenDto);
				oauthService.provisionUser.mockResolvedValue({ user, redirect });

				const response: OAuthProcessDto = await uc.processOAuthLogin(cachedState, code);

				expect(response).toEqual<OAuthProcessDto>({
					jwt,
					redirect,
				});
			});
		});
	});
});
