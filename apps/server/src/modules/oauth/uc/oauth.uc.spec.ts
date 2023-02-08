import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ISession } from '@shared/domain/types/session';
import { setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import { OauthUc } from '@src/modules/oauth/uc/oauth.uc';
import { ProvisioningDto, ProvisioningService } from '@src/modules/provisioning';
import { ExternalSchoolDto, ExternalUserDto, OauthDataDto, ProvisioningSystemDto } from '@src/modules/provisioning/dto';
import { SystemDto, SystemService } from '@src/modules/system/service';
import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';
import { UserService } from '@src/modules/user';
import { UserMigrationService } from '@src/modules/user-migration';
import { OauthTokenResponse } from '../controller/dto';
import { SSOErrorCode } from '../error/sso-error-code.enum';
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

		uc = module.get(OauthUc);
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

	describe('startOauthLogin is called', () => {
		const setup = () => {
			const systemId = 'systemId';
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

				systemService.findOAuthById.mockResolvedValue(system);
				oauthService.getAuthenticationUrl.mockReturnValue(authenticationUrl);

				const result: string = await uc.startOauthLogin(session, systemId, false);

				expect(result).toEqual(authenticationUrl);
			});

			it('should save data to the session', async () => {
				const { systemId, system } = setup();
				const session: DeepMocked<ISession> = createMock<ISession>();
				const authenticationUrl = 'authenticationUrl';
				const postLoginRedirect = 'postLoginRedirect';

				systemService.findOAuthById.mockResolvedValue(system);
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

				systemService.findOAuthById.mockResolvedValue(system);
				oauthService.getAuthenticationUrl.mockReturnValue(authenticationUrl);

				const func = async () => uc.startOauthLogin(session, systemId, false);

				await expect(func).rejects.toThrow(UnprocessableEntityException);
			});
		});
	});

	describe('processOAuthLogin is called', () => {
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

			const userJwt = 'schulcloudJwt';

			systemService.findOAuthById.mockResolvedValue(system);
			oauthService.requestToken.mockResolvedValue(oauthTokenResponse);
			provisioningService.getData.mockResolvedValue(oauthData);
			provisioningService.provisionData.mockResolvedValue(provisioningDto);
			oauthService.findUser.mockResolvedValue(user);
			oauthService.getJwtForUser.mockResolvedValue(userJwt);
			oauthService.getRedirectUrl.mockReturnValue(postLoginRedirect);

			return {
				cachedState,
				code,
				error,
				system,
				externalUserId,
				user,
				oauthData,
				provisioningDto,
				userJwt,
				oauthConfig,
				postLoginRedirect,
			};
		};

		describe('when the process runs successfully', () => {
			it('should return a valid jwt', async () => {
				const { cachedState, code, userJwt, postLoginRedirect } = setup();

				const response: OAuthProcessDto = await uc.processOAuthLogin(cachedState, code);

				expect(response).toEqual<OAuthProcessDto>({
					redirect: postLoginRedirect,
					jwt: userJwt,
				});
			});
		});

		describe('when oauth config is missing', () => {
			it('should throw OAuthSSOError', async () => {
				const { cachedState, code, system } = setup();
				system.oauthConfig = undefined;

				const func = async () => uc.processOAuthLogin(cachedState, code);

				await expect(func).rejects.toThrow(
					new OAuthSSOError(`Requested system systemId has no oauth configured`, SSOErrorCode.SSO_INTERNAL_ERROR)
				);
			});
		});

		describe('when authentication in external system failed', () => {
			it('should throw OAuthSSOError', async () => {
				const { cachedState, error } = setup();

				const func = async () => uc.processOAuthLogin(cachedState, undefined, error);

				await expect(func).rejects.toThrow(new OAuthSSOError('Authorization in external system failed', error));
			});
		});

		describe('when the provisioning returns a school with an officialSchoolNumber', () => {
			const setupMigration = () => {
				const setupData = setup();
				const migrationRedirect = 'migrationRedirectUrl';
				const migrationResponse: OAuthProcessDto = new OAuthProcessDto({
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
					const { cachedState, code, migrationResponse } = setupMigration();

					userService.findByExternalId.mockResolvedValue(null);
					userMigrationService.isSchoolInMigration.mockResolvedValue(true);

					const response: OAuthProcessDto = await uc.processOAuthLogin(cachedState, code);

					expect(response).toEqual(migrationResponse);
				});
			});

			describe('when the school is currently migrating to another system and the user exists', () => {
				it('should should finish the process normally and return a valid jwt', async () => {
					const { cachedState, code, user, userJwt, postLoginRedirect } = setupMigration();

					userService.findByExternalId.mockResolvedValue(user);
					userMigrationService.isSchoolInMigration.mockResolvedValue(true);

					const response: OAuthProcessDto = await uc.processOAuthLogin(cachedState, code);

					expect(response).toEqual<OAuthProcessDto>({
						redirect: postLoginRedirect,
						jwt: userJwt,
					});
				});
			});

			describe('when the school is not in a migration to another system', () => {
				it('should should finish the process normally and return a valid jwt', async () => {
					const { cachedState, code, userJwt, postLoginRedirect } = setupMigration();

					userService.findByExternalId.mockResolvedValue(null);
					userMigrationService.isSchoolInMigration.mockResolvedValue(false);

					const response: OAuthProcessDto = await uc.processOAuthLogin(cachedState, code);

					expect(response).toEqual<OAuthProcessDto>({
						redirect: postLoginRedirect,
						jwt: userJwt,
					});
				});
			});
		});
	});
});
