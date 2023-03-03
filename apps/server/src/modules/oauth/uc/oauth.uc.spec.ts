import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { FeathersJwtProvider } from '@src/modules/authorization';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import { OauthUc } from '@src/modules/oauth/uc/oauth.uc';
import { ProvisioningService } from '@src/modules/provisioning';
import { ExternalUserDto, OauthDataDto, ProvisioningSystemDto } from '@src/modules/provisioning/dto';
import { SchoolService } from '@src/modules/school';
import { OauthConfigDto, SystemDto } from '@src/modules/system/service';
import { SystemService } from '@src/modules/system/service/system.service';
import { UserService } from '@src/modules/user';
import { UserMigrationService } from '@src/modules/user-login-migration';
import { OAuthMigrationError } from '@src/modules/user-login-migration/error/oauth-migration.error';
import { SchoolMigrationService } from '@src/modules/user-login-migration/service';
import { MigrationDto } from '@src/modules/user-login-migration/service/dto/migration.dto';
import { AuthorizationParams } from '../controller/dto';
import { OAuthTokenDto } from '../interface';
import { OAuthProcessDto } from '../service/dto/oauth-process.dto';
import { OAuthService } from '../service/oauth.service';
import resetAllMocks = jest.resetAllMocks;

describe('OAuthUc', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let uc: OauthUc;

	let oauthService: DeepMocked<OAuthService>;
	let systemService: DeepMocked<SystemService>;
	let jwtService: DeepMocked<FeathersJwtProvider>;
	let provisioningService: DeepMocked<ProvisioningService>;
	let userMigrationService: DeepMocked<UserMigrationService>;
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
					provide: FeathersJwtProvider,
					useValue: createMock<FeathersJwtProvider>(),
				},
			],
		}).compile();
		uc = module.get(OauthUc);
		systemService = module.get(SystemService);
		oauthService = module.get(OAuthService);
		jwtService = module.get(FeathersJwtProvider);
		provisioningService = module.get(ProvisioningService);
		userMigrationService = module.get(UserMigrationService);
		schoolMigrationService = module.get(SchoolMigrationService);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	afterEach(() => {
		resetAllMocks();
	});

	describe('processOAuth is called', () => {
		const setup = () => {
			const query: AuthorizationParams = { code: '43534543jnj543342jn2' };
			const jwt = 'schulcloudJwt';
			const redirect = 'redirect';
			const baseResponse: OAuthProcessDto = {
				redirect,
			};
			const user: UserDO = new UserDO({
				id: 'mockUserId',
				firstName: 'firstName',
				lastName: 'lastame',
				email: '',
				roleIds: [],
				schoolId: 'mockSchoolId',
				externalId: 'mockExternalId',
			});
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

			return { query, jwt, redirect, baseResponse, user, testSystem, tokenDto };
		};
		describe('when a user is returned', () => {
			it('should return a response with a valid jwt', async () => {
				const { tokenDto, query, jwt, redirect, baseResponse, user, testSystem } = setup();
				oauthService.authenticateUser.mockResolvedValue(tokenDto);
				oauthService.provisionUser.mockResolvedValue({ user, redirect });
				jwtService.generateJwt.mockResolvedValue(jwt);

				const response: OAuthProcessDto = await uc.processOAuth(query, testSystem.id!);
				expect(response).toEqual(
					expect.objectContaining({
						jwt,
						...baseResponse,
					})
				);
				expect(response.jwt).toStrictEqual(jwt);
			});
		});

		describe('when no user is returned', () => {
			it('should return a response without a jwt', async () => {
				const { tokenDto, query, redirect, baseResponse, testSystem } = setup();
				oauthService.authenticateUser.mockResolvedValue(tokenDto);
				oauthService.provisionUser.mockResolvedValue({ redirect });

				const response: OAuthProcessDto = await uc.processOAuth(query, testSystem.id!);
				expect(response).toEqual(
					expect.objectContaining({
						...baseResponse,
					})
				);
			});
		});

		describe('when an error occurs', () => {
			it('should return an OAuthProcessDto with error', async () => {
				const errorResponse: OAuthProcessDto = {
					provider: 'unknown-provider',
					errorCode: 'sso_internal_error',
					redirect: 'errorRedirect',
				};
				const { query, testSystem } = setup();
				oauthService.getOAuthErrorResponse.mockReturnValue(errorResponse);
				oauthService.authenticateUser.mockRejectedValue(new OAuthSSOError('Testmessage'));
				systemService.findOAuthById.mockResolvedValue(testSystem);

				const response: OAuthProcessDto = await uc.processOAuth(query, testSystem.id!);

				expect(response).toEqual(errorResponse);
			});
		});
	});

	describe('migration', () => {
		const setupMigration = () => {
			const query: AuthorizationParams = { code: '43534543jnj543342jn2' };

			const oauthConfig: OauthConfigDto = new OauthConfigDto({
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

			const tokenDto: OAuthTokenDto = new OAuthTokenDto({
				idToken: 'idToken',
				refreshToken: 'refreshToken',
				accessToken: 'accessToken',
			});

			provisioningService.getData.mockResolvedValue(oauthData);

			return {
				query,
				system,
				userMigrationDto,
				userMigrationFailedDto,
				tokenDto,
				oauthData,
			};
		};

		describe('migrate is called', () => {
			describe('when authorize user and migration was successful', () => {
				it('should return redirect to migration succeed page', async () => {
					const { query, system, userMigrationDto, tokenDto } = setupMigration();
					systemService.findOAuthById.mockResolvedValue(system);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);
					oauthService.authenticateUser.mockResolvedValue(tokenDto);

					const result: MigrationDto = await uc.migrate('currentUserId', query, system.id as string);

					expect(result.redirect).toStrictEqual('https://mock.de/migration/succeed');
				});
			});

			describe('when migration failed', () => {
				it('should return redirect to dashboard ', async () => {
					const { query, system, userMigrationFailedDto, tokenDto } = setupMigration();
					systemService.findOAuthById.mockResolvedValue(system);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationFailedDto);
					oauthService.authenticateUser.mockResolvedValue(tokenDto);

					const result: MigrationDto = await uc.migrate('currentUserId', query, 'systemdId');

					expect(result.redirect).toStrictEqual('https://mock.de/dashboard');
				});
			});

			describe('when external school and official school number is defined and school has to be migrated', () => {
				it('should call migrateSchool', async () => {
					const { oauthData, query, system, userMigrationDto, tokenDto } = setupMigration();
					oauthData.externalSchool = {
						externalId: 'mockId',
						officialSchoolNumber: 'mockNumber',
						name: 'mockName',
					};
					const schoolToMigrate: SchoolDO | void = new SchoolDO({ name: 'mockName' });
					oauthService.authenticateUser.mockResolvedValue(tokenDto);
					schoolMigrationService.schoolToMigrate.mockResolvedValue(schoolToMigrate);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

					await uc.migrate('currentUserId', query, system.id as string);

					expect(schoolMigrationService.migrateSchool).toHaveBeenCalledWith(
						oauthData.externalSchool.externalId,
						schoolToMigrate,
						'systemId'
					);
				});
			});

			describe('when external school and official school number is defined and school is already migrated', () => {
				it('should not call migrateSchool', async () => {
					const { oauthData, query, system, userMigrationDto, tokenDto } = setupMigration();
					oauthData.externalSchool = {
						externalId: 'mockId',
						officialSchoolNumber: 'mockNumber',
						name: 'mockName',
					};
					oauthService.authenticateUser.mockResolvedValue(tokenDto);
					schoolMigrationService.schoolToMigrate.mockResolvedValue(null);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

					await uc.migrate('currentUserId', query, system.id as string);

					expect(schoolMigrationService.migrateSchool).not.toHaveBeenCalled();
				});
			});

			describe('when external school is not defined', () => {
				it('should not call schoolToMigrate', async () => {
					const { query, system, userMigrationDto, tokenDto } = setupMigration();
					oauthService.authenticateUser.mockResolvedValue(tokenDto);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

					await uc.migrate('currentUserId', query, system.id as string);

					expect(schoolMigrationService.schoolToMigrate).not.toHaveBeenCalled();
				});
			});

			describe('when official school number is not defined', () => {
				it('should throw OAuthMigrationError', async () => {
					const { oauthData, query, system, userMigrationDto, tokenDto } = setupMigration();
					oauthData.externalSchool = {
						externalId: 'mockId',
						name: 'mockName',
					};
					const error = new OAuthMigrationError(
						'Official school number from target migration system is missing',
						'ext_official_school_number_missing'
					);
					oauthService.authenticateUser.mockResolvedValue(tokenDto);
					schoolMigrationService.schoolToMigrate.mockImplementation(() => {
						throw error;
					});
					userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

					await expect(uc.migrate('currentUserId', query, system.id as string)).rejects.toThrow(error);
				});
			});
		});
	});
});
