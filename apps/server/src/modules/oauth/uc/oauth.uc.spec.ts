import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ISession } from '@shared/domain/types/session';
import { setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { AuthenticationService, ICurrentUser } from '@src/modules/authentication';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import { OauthUc } from '@src/modules/oauth/uc/oauth.uc';
import { ProvisioningService } from '@src/modules/provisioning';
import { ExternalUserDto, OauthDataDto, ProvisioningSystemDto } from '@src/modules/provisioning/dto';
import { SchoolService } from '@src/modules/school';
import { SystemDto, SystemService } from '@src/modules/system/service';
import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';
import { UserService } from '@src/modules/user';
import { UserMigrationService } from '@src/modules/user-login-migration';
import { OAuthMigrationError } from '@src/modules/user-login-migration/error/oauth-migration.error';
import { SchoolMigrationService } from '@src/modules/user-login-migration/service';
import { MigrationDto } from '@src/modules/user-login-migration/service/dto/migration.dto';
import { AuthorizationParams, OauthTokenResponse } from '../controller/dto';
import { OAuthProcessDto } from '../service/dto/oauth-process.dto';
import { OAuthService } from '../service/oauth.service';
import { OauthLoginStateDto } from './dto/oauth-login-state.dto';
import resetAllMocks = jest.resetAllMocks;

jest.mock('nanoid', () => {
	return {
		nanoid: () => 'mockNanoId',
	};
});

describe('OAuthUc', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let uc: OauthUc;

	let authenticationService: DeepMocked<AuthenticationService>;
	let oauthService: DeepMocked<OAuthService>;
	let systemService: DeepMocked<SystemService>;
	let provisioningService: DeepMocked<ProvisioningService>;
	let userMigrationService: DeepMocked<UserMigrationService>;
	let userService: DeepMocked<UserService>;
	let schoolMigrationService: DeepMocked<SchoolMigrationService>;

	beforeAll(async () => {
		orm = await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				OauthUc,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
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
					provide: ProvisioningService,
					useValue: createMock<ProvisioningService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: UserMigrationService,
					useValue: createMock<UserMigrationService>(),
				},
				{
					provide: SchoolMigrationService,
					useValue: createMock<SchoolMigrationService>(),
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
		provisioningService = module.get(ProvisioningService);
		userService = module.get(UserService);
		userMigrationService = module.get(UserMigrationService);
		schoolMigrationService = module.get(SchoolMigrationService);
		authenticationService = module.get(AuthenticationService);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	afterEach(() => {
		resetAllMocks();
	});

	describe('startOauthLogin is called', () => {
		const setup = () => {
			const systemId = 'systemId';
			const oauthConfig: OauthConfigDto = new OauthConfigDto({
				alias: 'alias',
				clientId: '12345',
				clientSecret: 'mocksecret',
				tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
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
				id: systemId,
				type: 'oauth',
				oauthConfig,
			});

			return {
				systemId,
				system,
				oauthConfig,
			};
		};

		describe('when starting an oauth login', () => {
			it('should return the authentication url for the system', async () => {
				const { systemId, system } = setup();
				const session: DeepMocked<ISession> = createMock<ISession>();
				const authenticationUrl = 'authenticationUrl';

				systemService.findById.mockResolvedValue(system);
				oauthService.getAuthenticationUrl.mockReturnValue(authenticationUrl);

				const result: string = await uc.startOauthLogin(session, systemId, false);

				expect(result).toEqual(authenticationUrl);
			});

			it('should save data to the session', async () => {
				const { systemId, system } = setup();
				const session: DeepMocked<ISession> = createMock<ISession>();
				const authenticationUrl = 'authenticationUrl';
				const postLoginRedirect = 'postLoginRedirect';

				systemService.findById.mockResolvedValue(system);
				oauthService.getAuthenticationUrl.mockReturnValue(authenticationUrl);

				await uc.startOauthLogin(session, systemId, false, postLoginRedirect);

				expect(session.oauthLoginState).toEqual<OauthLoginStateDto>({
					systemId,
					state: 'mockNanoId',
					postLoginRedirect,
					provider: system.oauthConfig?.provider as string,
				});
			});
		});

		describe('when the system cannot be found', () => {
			it('should throw UnprocessableEntityException', async () => {
				const { systemId, system } = setup();
				system.oauthConfig = undefined;
				const session: DeepMocked<ISession> = createMock<ISession>();
				const authenticationUrl = 'authenticationUrl';

				systemService.findById.mockResolvedValue(system);
				oauthService.getAuthenticationUrl.mockReturnValue(authenticationUrl);

				const func = async () => uc.startOauthLogin(session, systemId, false);

				await expect(func).rejects.toThrow(UnprocessableEntityException);
			});
		});
	});

	describe('processOAuth is called', () => {
		const setup = () => {
			const postLoginRedirect = 'postLoginRedirect';
			const cachedState: OauthLoginStateDto = new OauthLoginStateDto({
				state: 'state',
				systemId: 'systemId',
				postLoginRedirect,
				provider: 'mock_provider',
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
				roleIds: [],
				schoolId: 'mockSchoolId',
				externalId: 'mockExternalId',
			});

			const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
			const testSystem: SystemDto = new SystemDto({
				id: 'mockSystemId',
				type: 'mock',
				oauthConfig: { provider: 'testProvider' } as OauthConfigDto,
			});
			return { cachedState, code, error, jwt, redirect, user, currentUser, testSystem };
		};
		describe('when a user is returned', () => {
			it('should return a response with a valid jwt', async () => {
				const { cachedState, code, error, jwt, redirect, user, currentUser } = setup();

				userService.getResolvedUser.mockResolvedValue(currentUser);
				authenticationService.generateJwt.mockResolvedValue({ accessToken: jwt });
				oauthService.authenticateUser.mockResolvedValue({ user, redirect });

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
				const { cachedState, code, error, redirect } = setup();
				oauthService.checkAuthorizationCode.mockReturnValue(code);
				oauthService.authenticateUser.mockResolvedValue({ redirect });

				const response: OAuthProcessDto = await uc.processOAuthLogin(cachedState, code, error);
				expect(response).toEqual(
					expect.objectContaining({
						redirect,
					})
				);
			});
		});

		describe('when an error occurs', () => {
			it('should return an OAuthProcessDto with error', async () => {
				const { cachedState, code, error, testSystem } = setup();
				oauthService.checkAuthorizationCode.mockReturnValue(code);
				oauthService.authenticateUser.mockRejectedValue(new OAuthSSOError('Testmessage'));
				systemService.findById.mockResolvedValue(testSystem);

				const response = uc.processOAuthLogin(cachedState, code, error);

				await expect(response).rejects.toThrow(OAuthSSOError);
			});
		});

		describe('when the process runs successfully', () => {
			it('should return a valid jwt', async () => {
				const { cachedState, code, user, currentUser, jwt, redirect } = setup();

				userService.getResolvedUser.mockResolvedValue(currentUser);
				authenticationService.generateJwt.mockResolvedValue({ accessToken: jwt });
				oauthService.authenticateUser.mockResolvedValue({ user, redirect });

				const response: OAuthProcessDto = await uc.processOAuthLogin(cachedState, code);

				expect(response).toEqual<OAuthProcessDto>({
					jwt,
					redirect,
				});
			});
		});
	});

	describe('migration', () => {
		const setupMigration = () => {
			const code = '43534543jnj543342jn2';

			const query: AuthorizationParams = { code, state: 'state' };

			const cachedState: OauthLoginStateDto = new OauthLoginStateDto({
				state: 'state',
				systemId: 'systemId',
				provider: 'mock_provider',
			});

			const oauthConfig: OauthConfigDto = new OauthConfigDto({
				alias: 'alias',
				clientId: '12345',
				clientSecret: 'mocksecret',
				tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
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

			const oauthTokenResponse: OauthTokenResponse = {
				access_token: 'accessToken',
				refresh_token: 'refreshToken',
				id_token: 'idToken',
			};

			const externalUserId = 'externalUserId';

			const oauthData: OauthDataDto = new OauthDataDto({
				system: new ProvisioningSystemDto({
					systemId: 'systemId',
					provisioningStrategy: SystemProvisioningStrategy.SANIS,
				}),
				externalUser: new ExternalUserDto({
					externalId: externalUserId,
				}),
			});

			const userMigrationDto: MigrationDto = new MigrationDto({
				redirect: 'https://mock.de/migration/succeed',
			});

			const userMigrationFailedDto: MigrationDto = new MigrationDto({
				redirect: 'https://mock.de/dashboard',
			});

			oauthService.checkAuthorizationCode.mockReturnValue(code);
			oauthService.requestToken.mockResolvedValue(oauthTokenResponse);
			provisioningService.getData.mockResolvedValue(oauthData);

			return {
				code,
				query,
				cachedState,
				system,
				userMigrationDto,
				userMigrationFailedDto,
				oauthTokenResponse,
				oauthData,
				oauthConfig,
			};
		};

		describe('migrate is called', () => {
			describe('when authorize user and migration was successful', () => {
				it('should return redirect to migration succeed page', async () => {
					const { query, cachedState, system, userMigrationDto, oauthTokenResponse } = setupMigration();
					systemService.findById.mockResolvedValue(system);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);
					oauthService.authorizeForMigration.mockResolvedValue(oauthTokenResponse);

					const result: MigrationDto = await uc.migrate('jwt', 'currentUserId', query, cachedState);

					expect(result.redirect).toStrictEqual('https://mock.de/migration/succeed');
				});

				it('should remove the jwt from the whitelist', async () => {
					const { query, system, userMigrationDto, oauthTokenResponse, cachedState } = setupMigration();
					systemService.findById.mockResolvedValue(system);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);
					oauthService.authorizeForMigration.mockResolvedValue(oauthTokenResponse);

					await uc.migrate('jwt', 'currentUserId', query, cachedState);

					expect(authenticationService.removeJwtFromWhitelist).toHaveBeenCalledWith('jwt');
				});
			});

			describe('when the jwt cannot be removed', () => {
				it('should throw', async () => {
					const { query, system, userMigrationDto, oauthTokenResponse, cachedState } = setupMigration();
					const error: Error = new Error('testError');
					systemService.findById.mockResolvedValue(system);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);
					oauthService.authorizeForMigration.mockResolvedValue(oauthTokenResponse);
					authenticationService.removeJwtFromWhitelist.mockRejectedValue(error);

					const func = () => uc.migrate('jwt', 'currentUserId', query, cachedState);

					await expect(func).rejects.toThrow(error);
				});
			});

			describe('when migration failed', () => {
				it('should return redirect to dashboard ', async () => {
					const { query, cachedState, userMigrationFailedDto, oauthTokenResponse } = setupMigration();
					userMigrationService.migrateUser.mockResolvedValue(userMigrationFailedDto);
					oauthService.authorizeForMigration.mockResolvedValue(oauthTokenResponse);

					const result: MigrationDto = await uc.migrate('jwt', 'currentUserId', query, cachedState);

					expect(result.redirect).toStrictEqual('https://mock.de/dashboard');
				});
			});

			describe('when external school and official school number is defined and school has to be migrated', () => {
				it('should call migrateSchool', async () => {
					const { oauthData, query, cachedState, userMigrationDto, oauthTokenResponse } = setupMigration();
					oauthData.externalSchool = {
						externalId: 'mockId',
						officialSchoolNumber: 'mockNumber',
						name: 'mockName',
					};
					const schoolToMigrate: SchoolDO | void = new SchoolDO({ name: 'mockName' });
					oauthService.authorizeForMigration.mockResolvedValue(oauthTokenResponse);
					schoolMigrationService.schoolToMigrate.mockResolvedValue(schoolToMigrate);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

					await uc.migrate('jwt', 'currentUserId', query, cachedState);

					expect(schoolMigrationService.migrateSchool).toHaveBeenCalledWith(
						oauthData.externalSchool.externalId,
						schoolToMigrate,
						'systemId'
					);
				});
			});

			describe('when external school and official school number is defined and school is already migrated', () => {
				it('should not call migrateSchool', async () => {
					const { oauthData, query, cachedState, userMigrationDto, oauthTokenResponse } = setupMigration();
					oauthData.externalSchool = {
						externalId: 'mockId',
						officialSchoolNumber: 'mockNumber',
						name: 'mockName',
					};
					oauthService.authorizeForMigration.mockResolvedValue(oauthTokenResponse);
					schoolMigrationService.schoolToMigrate.mockResolvedValue(null);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

					await uc.migrate('jwt', 'currentUserId', query, cachedState);

					expect(schoolMigrationService.migrateSchool).not.toHaveBeenCalled();
				});
			});

			describe('when external school is not defined', () => {
				it('should not call schoolToMigrate', async () => {
					const { query, cachedState, userMigrationDto, oauthTokenResponse } = setupMigration();
					oauthService.authorizeForMigration.mockResolvedValue(oauthTokenResponse);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

					await uc.migrate('jwt', 'currentUserId', query, cachedState);

					expect(schoolMigrationService.schoolToMigrate).not.toHaveBeenCalled();
				});
			});

			describe('when official school number is not defined', () => {
				it('should throw OAuthMigrationError', async () => {
					const { oauthData, query, cachedState, userMigrationDto, oauthTokenResponse } = setupMigration();
					oauthData.externalSchool = {
						externalId: 'mockId',
						name: 'mockName',
					};
					const error = new OAuthMigrationError(
						'Official school number from target migration system is missing',
						'ext_official_school_number_missing'
					);
					oauthService.authorizeForMigration.mockResolvedValue(oauthTokenResponse);
					schoolMigrationService.schoolToMigrate.mockImplementation(() => {
						throw error;
					});
					userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

					await expect(uc.migrate('jwt', 'currentUserId', query, cachedState)).rejects.toThrow(error);
				});
			});
		});
		describe('when state is mismatched', () => {
			it('should throw an UnauthorizedException', async () => {
				const query: AuthorizationParams = { state: 'failedState' };
				const { cachedState, userMigrationDto, oauthTokenResponse } = setupMigration();
				oauthService.authorizeForMigration.mockResolvedValue(oauthTokenResponse);
				userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

				const response = uc.migrate('jwt', 'currentUserId', query, cachedState);

				await expect(response).rejects.toThrow(UnauthorizedException);
			});
		});
	});
});
