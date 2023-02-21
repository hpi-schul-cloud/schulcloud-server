import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM, NotFoundError } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { setupEntities, systemFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import { OauthUc } from '@src/modules/oauth/uc/oauth.uc';
import { ProvisioningDto, ProvisioningService } from '@src/modules/provisioning';
import { ExternalSchoolDto, ExternalUserDto, OauthDataDto, ProvisioningSystemDto } from '@src/modules/provisioning/dto';
import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';
import { SystemService } from '@src/modules/system/service/system.service';
import { UserService } from '@src/modules/user';
import { UserMigrationService } from '@src/modules/user-migration';
import { NotFoundException } from '@nestjs/common';
import { SystemDto } from '@src/modules/system/service';
import { UserMigrationDto } from '@src/modules/user-migration/service/dto/userMigration.dto';
import { AuthorizationParams, OauthTokenResponse } from '../controller/dto';
import { OAuthProcessDto } from '../service/dto/oauth-process.dto';
import { OAuthService } from '../service/oauth.service';
import resetAllMocks = jest.resetAllMocks;

describe('OAuthUc', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let service: OauthUc;

	let oauthService: DeepMocked<OAuthService>;
	let systemService: DeepMocked<SystemService>;
	let provisioningService: DeepMocked<ProvisioningService>;
	let userService: DeepMocked<UserService>;
	let userMigrationService: DeepMocked<UserMigrationService>;

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
					provide: UserMigrationService,
					useValue: createMock<UserMigrationService>(),
				},
			],
		}).compile();

		service = module.get(OauthUc);
		systemService = module.get(SystemService);
		oauthService = module.get(OAuthService);
		provisioningService = module.get(ProvisioningService);
		userService = module.get(UserService);
		userMigrationService = module.get(UserMigrationService);
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
			const code = '43534543jnj543342jn2';
			const query: AuthorizationParams = { code };

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

			const oauthTokenResponse: OauthTokenResponse = {
				access_token: 'accessToken',
				refresh_token: 'refreshToken',
				id_token: 'idToken',
			};

			const externalUserId = 'externalUserId';
			const user: UserDO = new UserDO({
				firstName: 'firstName',
				lastName: 'lastName',
				email: 'email',
				schoolId: 'schoolId',
				roleIds: ['roleId'],
				externalId: externalUserId,
			});
			const oauthData: OauthDataDto = new OauthDataDto({
				system: new ProvisioningSystemDto({
					systemId: 'systemId',
					provisioningStrategy: SystemProvisioningStrategy.OIDC,
				}),
				externalUser: new ExternalUserDto({
					externalId: externalUserId,
				}),
			});
			const provisioningDto: ProvisioningDto = new ProvisioningDto({
				externalUserId,
			});

			const postLoginRedirect = 'postLoginRedirect';
			const successResponse: OAuthProcessDto = new OAuthProcessDto({
				idToken: 'idToken',
				logoutEndpoint: oauthConfig.logoutEndpoint,
				provider: oauthConfig.provider,
				redirect: postLoginRedirect,
			});

			const userJwt = 'schulcloudJwt';

			oauthService.checkAuthorizationCode.mockReturnValue(code);
			systemService.findOAuthById.mockResolvedValue(system);
			oauthService.requestToken.mockResolvedValue(oauthTokenResponse);
			provisioningService.getData.mockResolvedValue(oauthData);
			provisioningService.provisionData.mockResolvedValue(provisioningDto);
			oauthService.findUser.mockResolvedValue(user);
			oauthService.getJwtForUser.mockResolvedValue(userJwt);
			oauthService.getRedirectUrl.mockReturnValue(postLoginRedirect);

			return {
				query,
				system,
				externalUserId,
				user,
				oauthData,
				provisioningDto,
				userJwt,
				oauthConfig,
				postLoginRedirect,
				successResponse,
			};
		};

		describe('when the process runs successfully', () => {
			it('should return a valid jwt', async () => {
				const { query, userJwt, successResponse } = setup();

				const response: OAuthProcessDto = await service.processOAuth(query, 'systemId');

				expect(response).toEqual<OAuthProcessDto>({
					...successResponse,
					jwt: userJwt,
				});
			});
		});

		describe('when oauth config is missing', () => {
			it('should build an oauthResponse with error', async () => {
				const { query, system } = setup();
				system.oauthConfig = undefined;

				const errorResponse: OAuthProcessDto = new OAuthProcessDto({
					provider: 'unknown-provider',
					errorCode: 'sso_internal_error',
					redirect: 'errorRedirect',
				});

				oauthService.getOAuthErrorResponse.mockReturnValue(errorResponse);

				const response: OAuthProcessDto = await service.processOAuth(query, 'systemId');

				expect(oauthService.getOAuthErrorResponse).toHaveBeenCalledWith(expect.any(Error), 'unknown-provider');
				expect(response).toEqual(errorResponse);
			});
		});

		describe('when an internal error occurs', () => {
			it('should return an error response that contains the provider', async () => {
				const { query } = setup();

				const errorResponse: OAuthProcessDto = new OAuthProcessDto({
					provider: 'mock_provider',
					errorCode: 'sso_internal_error',
					redirect: 'errorRedirect',
				});

				oauthService.requestToken.mockRejectedValue(new OAuthSSOError());
				oauthService.getOAuthErrorResponse.mockReturnValue(errorResponse);

				const response: OAuthProcessDto = await service.processOAuth(query, 'systemId');

				expect(oauthService.getOAuthErrorResponse).toHaveBeenCalledWith(expect.any(Error), 'mock_provider');
				expect(response).toEqual(errorResponse);
			});
		});

		describe('when processOAuth failed and the provider cannot be fetched from the system', () => {
			it('should return an OAuthResponse with error', async () => {
				const { query, system } = setup();
				system.oauthConfig = undefined;

				const errorResponse: OAuthProcessDto = new OAuthProcessDto({
					provider: 'unknown-provider',
					errorCode: 'sso_internal_error',
					redirect: 'errorRedirect',
				});

				oauthService.checkAuthorizationCode.mockImplementation(() => {
					throw new OAuthSSOError(
						'Authorization Query Object has no authorization code or error',
						'sso_auth_code_step'
					);
				});
				systemService.findOAuthById.mockResolvedValue(system);
				oauthService.getOAuthErrorResponse.mockReturnValue(errorResponse);

				const response: OAuthProcessDto = await service.processOAuth(query, 'systemId');

				expect(response).toEqual(errorResponse);
			});
		});

		describe('when no system was found', () => {
			it('should throw a NotFoundError', async () => {
				const { query } = setup();

				oauthService.checkAuthorizationCode.mockImplementation(() => {
					throw new OAuthSSOError(
						'Authorization Query Object has no authorization code or error',
						'sso_auth_code_step'
					);
				});
				systemService.findOAuthById.mockRejectedValue(new NotFoundError('Not Found'));

				await expect(service.processOAuth(query, 'unknown id')).rejects.toThrow(NotFoundError);
			});
		});

		describe('when no system.id exist', () => {
			it('should return an OAuthResponse with error', async () => {
				const { query } = setup();
				const errorResponse: OAuthProcessDto = new OAuthProcessDto({
					provider: 'unknown-provider',
					errorCode: 'sso_internal_error',
					redirect: 'errorRedirect',
				});

				systemService.findOAuthById.mockResolvedValue({ id: undefined, type: 'ignore' });
				oauthService.getOAuthErrorResponse.mockReturnValue(errorResponse);

				const response: OAuthProcessDto = await service.processOAuth(query, 'brokenId');

				expect(response).toEqual(errorResponse);
			});
		});

		describe('when the provisioning returns a school with an officialSchoolNumber', () => {
			const setupMigration = () => {
				const setupData = setup();
				const migrationRedirect = 'migrationRedirectUrl';
				const migrationResponse: OAuthProcessDto = new OAuthProcessDto({
					provider: setupData.oauthConfig.provider,
					redirect: migrationRedirect,
				});

				setupData.oauthData.externalSchool = new ExternalSchoolDto({
					externalId: 'externalSchoolId',
					name: 'schoolName',
					officialSchoolNumber: 'officialSchoolNumber',
				});

				userMigrationService.getMigrationRedirect.mockResolvedValue(migrationRedirect);

				return {
					...setupData,
					migrationRedirect,
					migrationResponse,
				};
			};
			describe('when the school is currently migrating to another system and the user does not exist', () => {
				it('should return an OAuthResponse with a migration redirect url', async () => {
					const { query, migrationResponse } = setupMigration();

					userService.findByExternalId.mockResolvedValue(null);
					userMigrationService.isSchoolInMigration.mockResolvedValue(true);

					const response: OAuthProcessDto = await service.processOAuth(query, 'brokenId');

					expect(response).toEqual(migrationResponse);
				});
			});

			describe('when the school is currently migrating to another system and the user exists', () => {
				it('should should finish the process normally and return a valid jwt', async () => {
					const { query, user, userJwt, successResponse } = setupMigration();

					userService.findByExternalId.mockResolvedValue(user);
					userMigrationService.isSchoolInMigration.mockResolvedValue(true);

					const response: OAuthProcessDto = await service.processOAuth(query, 'brokenId');

					expect(response).toEqual<OAuthProcessDto>({
						...successResponse,
						jwt: userJwt,
					});
				});
			});

			describe('when the school is not in a migration to another system', () => {
				it('should should finish the process normally and return a valid jwt', async () => {
					const { query, userJwt, successResponse } = setupMigration();

					userService.findByExternalId.mockResolvedValue(null);
					userMigrationService.isSchoolInMigration.mockResolvedValue(false);

					const response: OAuthProcessDto = await service.processOAuth(query, 'brokenId');

					expect(response).toEqual<OAuthProcessDto>({
						...successResponse,
						jwt: userJwt,
					});
				});
			});
		});
	});

	describe('migration', () => {
		const setupMigration = () => {
			const code = '43534543jnj543342jn2';

			const query: AuthorizationParams = { code };

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
			const userMigrationDto: UserMigrationDto = new UserMigrationDto({
				redirect: 'https://mock.de/migration/succeed',
			});

			const userMigrationFailedDto: UserMigrationDto = new UserMigrationDto({
				redirect: 'https://mock.de/dashboard',
			});
			oauthService.checkAuthorizationCode.mockReturnValue(code);

			oauthService.requestToken.mockResolvedValue(oauthTokenResponse);
			provisioningService.getData.mockResolvedValue(oauthData);

			return {
				code,
				query,
				system,
				userMigrationDto,
				userMigrationFailedDto,
				oauthTokenResponse,
			};
		};

		describe('migrateUser', () => {
			describe('when authorize user and migration was successful', () => {
				it('should return redirect to migration succeed page', async () => {
					const { query, system, userMigrationDto } = setupMigration();
					systemService.findOAuthById.mockResolvedValue(system);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationDto);

					const result: UserMigrationDto = await service.migrateUser('currentUserId', query, system.id as string);

					expect(result.redirect).toStrictEqual('https://mock.de/migration/succeed');
				});
			});

			describe('when migration failed', () => {
				it('should return redirect to dashboard ', async () => {
					const { query, system, userMigrationFailedDto } = setupMigration();
					systemService.findOAuthById.mockResolvedValue(system);
					userMigrationService.migrateUser.mockResolvedValue(userMigrationFailedDto);

					const result: UserMigrationDto = await service.migrateUser('currentUserId', query, 'systemdId');

					expect(result.redirect).toStrictEqual('https://mock.de/dashboard');
				});
			});

			describe('when system id is not given', () => {
				it('should throw NotFoundException ', async () => {
					const { query } = setupMigration();
					systemService.findOAuthById.mockResolvedValue(systemFactory.build());

					await expect(service.migrateUser('currentUserId', query, 'systemdId')).rejects.toThrow(NotFoundException);
				});
			});
		});
	});
});
