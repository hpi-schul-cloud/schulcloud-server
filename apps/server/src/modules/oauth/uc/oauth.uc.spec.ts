import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ISession } from '@shared/domain/types/session';
import { schoolDOFactory, setupEntities } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { ICurrentUser } from '@src/modules/authentication';
import { AuthenticationService } from '@src/modules/authentication/services/authentication.service';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import { OauthUc } from '@src/modules/oauth/uc/oauth.uc';
import { ProvisioningService } from '@src/modules/provisioning';
import { ExternalUserDto, OauthDataDto, ProvisioningSystemDto } from '@src/modules/provisioning/dto';
import { SchoolService } from '@src/modules/school';
import { SystemService } from '@src/modules/system';
import { OauthConfigDto, SystemDto } from '@src/modules/system/service';
import { UserService } from '@src/modules/user';
import { UserMigrationService } from '@src/modules/user-login-migration';
import { OAuthMigrationError } from '@src/modules/user-login-migration/error/oauth-migration.error';
import { SchoolMigrationService } from '@src/modules/user-login-migration/service';
import { MigrationDto } from '@src/modules/user-login-migration/service/dto';
import { AuthorizationParams } from '../controller/dto';
import { OAuthTokenDto } from '../interface';
import { OAuthProcessDto } from '../service/dto';
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
	let uc: OauthUc;

	let authenticationService: DeepMocked<AuthenticationService>;
	let oauthService: DeepMocked<OAuthService>;
	let systemService: DeepMocked<SystemService>;
	let provisioningService: DeepMocked<ProvisioningService>;
	let userMigrationService: DeepMocked<UserMigrationService>;
	let userService: DeepMocked<UserService>;
	let schoolMigrationService: DeepMocked<SchoolMigrationService>;

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
	});

	afterEach(() => {
		resetAllMocks();
	});

	describe('startOauthLogin is called', () => {
		const setup = () => {
			const systemId = 'systemId';
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
					userLoginMigration: false,
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

	describe('migration', () => {
		describe('migrate is called', () => {
			describe('when authorize user and migration was successful', () => {
				const setupMigration = () => {
					const code = '43534543jnj543342jn2';

					const query: AuthorizationParams = { code, state: 'state' };

					const cachedState: OauthLoginStateDto = new OauthLoginStateDto({
						state: 'state',
						systemId: 'systemId',
						provider: 'mock_provider',
						userLoginMigration: true,
					});

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

					const tokenDto: OAuthTokenDto = new OAuthTokenDto({
						idToken: 'idToken',
						refreshToken: 'refreshToken',
						accessToken: 'accessToken',
					});

					oauthService.requestToken.mockResolvedValue(tokenDto);
					provisioningService.getData.mockResolvedValue(oauthData);
					systemService.findById.mockResolvedValue(system);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);
					oauthService.authenticateUser.mockResolvedValue(tokenDto);

					return {
						query,
						cachedState,
					};
				};

				it('should return redirect to migration succeed page', async () => {
					const { query, cachedState } = setupMigration();

					const result: MigrationDto = await uc.migrate('jwt', 'currentUserId', query, cachedState);

					expect(result.redirect).toStrictEqual('https://mock.de/migration/succeed');
				});

				it('should remove the jwt from the whitelist', async () => {
					const { query, cachedState } = setupMigration();

					await uc.migrate('jwt', 'currentUserId', query, cachedState);

					expect(authenticationService.removeJwtFromWhitelist).toHaveBeenCalledWith('jwt');
				});
			});

			describe('when the jwt cannot be removed', () => {
				const setupMigration = () => {
					const code = '43534543jnj543342jn2';

					const query: AuthorizationParams = { code, state: 'state' };

					const cachedState: OauthLoginStateDto = new OauthLoginStateDto({
						state: 'state',
						systemId: 'systemId',
						provider: 'mock_provider',
						userLoginMigration: true,
					});

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

					const tokenDto: OAuthTokenDto = new OAuthTokenDto({
						idToken: 'idToken',
						refreshToken: 'refreshToken',
						accessToken: 'accessToken',
					});

					oauthService.requestToken.mockResolvedValue(tokenDto);
					provisioningService.getData.mockResolvedValue(oauthData);

					const error: Error = new Error('testError');
					systemService.findById.mockResolvedValue(system);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);
					oauthService.authenticateUser.mockResolvedValue(tokenDto);
					authenticationService.removeJwtFromWhitelist.mockRejectedValue(error);

					return {
						query,
						cachedState,
						error,
					};
				};

				it('should throw', async () => {
					const { query, error, cachedState } = setupMigration();

					const func = () => uc.migrate('jwt', 'currentUserId', query, cachedState);

					await expect(func).rejects.toThrow(error);
				});
			});

			describe('when migration failed', () => {
				const setupMigration = () => {
					const code = '43534543jnj543342jn2';

					const query: AuthorizationParams = { code, state: 'state' };

					const cachedState: OauthLoginStateDto = new OauthLoginStateDto({
						state: 'state',
						systemId: 'systemId',
						provider: 'mock_provider',
						userLoginMigration: true,
					});

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

					const userMigrationFailedDto: MigrationDto = new MigrationDto({
						redirect: 'https://mock.de/dashboard',
					});

					const tokenDto: OAuthTokenDto = new OAuthTokenDto({
						idToken: 'idToken',
						refreshToken: 'refreshToken',
						accessToken: 'accessToken',
					});

					oauthService.requestToken.mockResolvedValue(tokenDto);
					provisioningService.getData.mockResolvedValue(oauthData);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationFailedDto);
					oauthService.authenticateUser.mockResolvedValue(tokenDto);

					return {
						query,
						cachedState,
					};
				};

				it('should return redirect to dashboard ', async () => {
					const { query, cachedState } = setupMigration();

					const result: MigrationDto = await uc.migrate('jwt', 'currentUserId', query, cachedState);

					expect(result.redirect).toStrictEqual('https://mock.de/dashboard');
				});
			});

			describe('when external school and official school number is defined ', () => {
				const setupMigration = () => {
					const code = '43534543jnj543342jn2';

					const query: AuthorizationParams = { code, state: 'state' };

					const cachedState: OauthLoginStateDto = new OauthLoginStateDto({
						state: 'state',
						systemId: 'systemId',
						provider: 'mock_provider',
						userLoginMigration: true,
					});

					const externalUserId = 'externalUserId';

					const oauthData: OauthDataDto = new OauthDataDto({
						system: new ProvisioningSystemDto({
							systemId: 'systemId',
							provisioningStrategy: SystemProvisioningStrategy.SANIS,
						}),
						externalUser: new ExternalUserDto({
							externalId: externalUserId,
						}),
						externalSchool: {
							externalId: 'mockId',
							officialSchoolNumber: 'mockNumber',
							name: 'mockName',
						},
					});

					const tokenDto: OAuthTokenDto = new OAuthTokenDto({
						idToken: 'idToken',
						refreshToken: 'refreshToken',
						accessToken: 'accessToken',
					});

					oauthService.requestToken.mockResolvedValue(tokenDto);
					provisioningService.getData.mockResolvedValue(oauthData);
					oauthService.authenticateUser.mockResolvedValue(tokenDto);
					return {
						query,
						cachedState,
						oauthData,
					};
				};

				it('should call schoolToMigrate', async () => {
					const { oauthData, query, cachedState } = setupMigration();

					await uc.migrate('jwt', 'currentUserId', query, cachedState);

					expect(schoolMigrationService.schoolToMigrate).toHaveBeenCalledWith(
						'currentUserId',
						oauthData.externalSchool?.externalId,
						oauthData.externalSchool?.officialSchoolNumber
					);
				});
			});

			describe('when external school and official school number is defined and school has to be migrated', () => {
				const setupMigration = () => {
					const code = '43534543jnj543342jn2';

					const query: AuthorizationParams = { code, state: 'state' };

					const cachedState: OauthLoginStateDto = new OauthLoginStateDto({
						state: 'state',
						systemId: 'systemId',
						provider: 'mock_provider',
						userLoginMigration: true,
					});

					const externalUserId = 'externalUserId';

					const oauthData: OauthDataDto = new OauthDataDto({
						system: new ProvisioningSystemDto({
							systemId: 'systemId',
							provisioningStrategy: SystemProvisioningStrategy.SANIS,
						}),
						externalUser: new ExternalUserDto({
							externalId: externalUserId,
						}),
						externalSchool: {
							externalId: 'mockId',
							officialSchoolNumber: 'mockNumber',
							name: 'mockName',
						},
					});

					const userMigrationDto: MigrationDto = new MigrationDto({
						redirect: 'https://mock.de/migration/succeed',
					});

					const tokenDto: OAuthTokenDto = new OAuthTokenDto({
						idToken: 'idToken',
						refreshToken: 'refreshToken',
						accessToken: 'accessToken',
					});

					oauthService.requestToken.mockResolvedValue(tokenDto);
					provisioningService.getData.mockResolvedValue(oauthData);
					const schoolToMigrate: SchoolDO | void = schoolDOFactory.build({ name: 'mockName' });
					oauthService.authenticateUser.mockResolvedValue(tokenDto);
					schoolMigrationService.schoolToMigrate.mockResolvedValue(schoolToMigrate);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

					return {
						query,
						cachedState,
						oauthData,
						schoolToMigrate,
					};
				};

				it('should call migrateSchool', async () => {
					const { oauthData, query, cachedState, schoolToMigrate } = setupMigration();

					await uc.migrate('jwt', 'currentUserId', query, cachedState);

					expect(schoolMigrationService.migrateSchool).toHaveBeenCalledWith(
						oauthData.externalSchool?.externalId,
						schoolToMigrate,
						'systemId'
					);
				});
			});

			describe('when external school and official school number is defined and school is already migrated', () => {
				const setupMigration = () => {
					const code = '43534543jnj543342jn2';

					const query: AuthorizationParams = { code, state: 'state' };

					const cachedState: OauthLoginStateDto = new OauthLoginStateDto({
						state: 'state',
						systemId: 'systemId',
						provider: 'mock_provider',
						userLoginMigration: true,
					});

					const externalUserId = 'externalUserId';

					const oauthData: OauthDataDto = new OauthDataDto({
						system: new ProvisioningSystemDto({
							systemId: 'systemId',
							provisioningStrategy: SystemProvisioningStrategy.SANIS,
						}),
						externalUser: new ExternalUserDto({
							externalId: externalUserId,
						}),
						externalSchool: {
							externalId: 'mockId',
							officialSchoolNumber: 'mockNumber',
							name: 'mockName',
						},
					});

					const userMigrationDto: MigrationDto = new MigrationDto({
						redirect: 'https://mock.de/migration/succeed',
					});

					const tokenDto: OAuthTokenDto = new OAuthTokenDto({
						idToken: 'idToken',
						refreshToken: 'refreshToken',
						accessToken: 'accessToken',
					});

					oauthService.requestToken.mockResolvedValue(tokenDto);
					provisioningService.getData.mockResolvedValue(oauthData);
					oauthService.authenticateUser.mockResolvedValue(tokenDto);
					schoolMigrationService.schoolToMigrate.mockResolvedValue(null);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

					return {
						query,
						cachedState,
					};
				};

				it('should not call migrateSchool', async () => {
					const { query, cachedState } = setupMigration();

					await uc.migrate('jwt', 'currentUserId', query, cachedState);

					expect(schoolMigrationService.migrateSchool).not.toHaveBeenCalled();
				});
			});

			describe('when external school is not defined', () => {
				const setupMigration = () => {
					const code = '43534543jnj543342jn2';

					const query: AuthorizationParams = { code, state: 'state' };

					const cachedState: OauthLoginStateDto = new OauthLoginStateDto({
						state: 'state',
						systemId: 'systemId',
						provider: 'mock_provider',
						userLoginMigration: true,
					});

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

					const tokenDto: OAuthTokenDto = new OAuthTokenDto({
						idToken: 'idToken',
						refreshToken: 'refreshToken',
						accessToken: 'accessToken',
					});

					oauthService.authenticateUser.mockResolvedValue(tokenDto);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);
					oauthService.requestToken.mockResolvedValue(tokenDto);
					provisioningService.getData.mockResolvedValue(oauthData);

					return {
						query,
						cachedState,
					};
				};

				it('should not call schoolToMigrate', async () => {
					const { query, cachedState } = setupMigration();

					await uc.migrate('jwt', 'currentUserId', query, cachedState);

					expect(schoolMigrationService.schoolToMigrate).not.toHaveBeenCalled();
				});
			});

			describe('when official school number is not defined', () => {
				const setupMigration = () => {
					const code = '43534543jnj543342jn2';

					const query: AuthorizationParams = { code, state: 'state' };

					const cachedState: OauthLoginStateDto = new OauthLoginStateDto({
						state: 'state',
						systemId: 'systemId',
						provider: 'mock_provider',
						userLoginMigration: true,
					});

					const externalUserId = 'externalUserId';

					const oauthData: OauthDataDto = new OauthDataDto({
						system: new ProvisioningSystemDto({
							systemId: 'systemId',
							provisioningStrategy: SystemProvisioningStrategy.SANIS,
						}),
						externalUser: new ExternalUserDto({
							externalId: externalUserId,
						}),
						externalSchool: {
							externalId: 'mockId',
							name: 'mockName',
						},
					});

					const userMigrationDto: MigrationDto = new MigrationDto({
						redirect: 'https://mock.de/migration/succeed',
					});

					const tokenDto: OAuthTokenDto = new OAuthTokenDto({
						idToken: 'idToken',
						refreshToken: 'refreshToken',
						accessToken: 'accessToken',
					});

					const error = new OAuthMigrationError(
						'Official school number from target migration system is missing',
						'ext_official_school_number_missing'
					);

					oauthService.requestToken.mockResolvedValue(tokenDto);
					provisioningService.getData.mockResolvedValue(oauthData);
					oauthService.authenticateUser.mockResolvedValue(tokenDto);
					schoolMigrationService.schoolToMigrate.mockImplementation(() => {
						throw error;
					});
					userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

					return {
						query,
						cachedState,
						error,
					};
				};

				it('should throw OAuthMigrationError', async () => {
					const { query, cachedState, error } = setupMigration();

					await expect(uc.migrate('jwt', 'currentUserId', query, cachedState)).rejects.toThrow(error);
				});
			});
		});

		describe('when state is mismatched', () => {
			const setupMigration = () => {
				const cachedState: OauthLoginStateDto = new OauthLoginStateDto({
					state: 'state',
					systemId: 'systemId',
					provider: 'mock_provider',
					userLoginMigration: true,
				});

				const query: AuthorizationParams = { state: 'failedState' };

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

				const tokenDto: OAuthTokenDto = new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				});

				oauthService.authenticateUser.mockResolvedValue(tokenDto);
				userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);
				oauthService.requestToken.mockResolvedValue(tokenDto);
				provisioningService.getData.mockResolvedValue(oauthData);

				return {
					cachedState,
					query,
				};
			};

			it('should throw an UnauthorizedException', async () => {
				const { cachedState, query } = setupMigration();

				const response = uc.migrate('jwt', 'currentUserId', query, cachedState);

				await expect(response).rejects.toThrow(UnauthorizedException);
			});
		});
	});
});
