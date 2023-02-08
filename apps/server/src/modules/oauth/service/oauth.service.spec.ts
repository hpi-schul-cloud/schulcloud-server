import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { MikroORM } from '@mikro-orm/core';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OauthConfig, System } from '@shared/domain';
import { SystemService } from '@src/modules/system/service/system.service';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { schoolFactory, setupEntities, userDoFactory, userFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { FeathersJwtProvider } from '@src/modules/authorization';
import { AuthorizationParams } from '@src/modules/oauth/controller/dto/authorization.params';
import { UserService } from '@src/modules/user';
import { AxiosResponse } from 'axios';
import { ObjectId } from 'bson';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { of, throwError } from 'rxjs';
import { DefaultEncryptionService, IEncryptionService, SymetricKeyEncryptionService } from '@shared/infra/encryption';
import { ProvisioningDto, ProvisioningService } from '@src/modules/provisioning';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { OauthTokenResponse } from '../controller/dto';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { IJwt } from '../interface/jwt.base.interface';
import { OAuthProcessDto } from './dto/oauth-process.dto';
import { OAuthService } from './oauth.service';
import { UserMigrationService } from '../../user-migration';
import { OauthConfigDto } from '../../system/service';
import { ExternalSchoolDto, ExternalUserDto, OauthDataDto, ProvisioningSystemDto } from '../../provisioning/dto';

const createAxiosResponse = <T = unknown>(data: T): AxiosResponse<T> => {
	return {
		data,
		status: 0,
		statusText: '',
		headers: {},
		config: {},
	};
};

jest.mock('jwks-rsa', () => () => {
	return {
		getKeys: jest.fn(),
		getSigningKey: jest.fn().mockResolvedValue({
			kid: 'kid',
			alg: 'alg',
			getPublicKey: jest.fn().mockReturnValue('publicKey'),
			rsaPublicKey: 'publicKey',
		}),
		getSigningKeys: jest.fn(),
	};
});

jest.mock('jsonwebtoken');

describe('OAuthService', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let service: OAuthService;
	let oAuthEncryptionService: DeepMocked<SymetricKeyEncryptionService>;
	let provisioningService: DeepMocked<ProvisioningService>;
	let userService: DeepMocked<UserService>;
	let feathersJwtProvider: DeepMocked<FeathersJwtProvider>;
	let httpService: DeepMocked<HttpService>;
	let systemService: DeepMocked<SystemService>;
	let userMigrationService: DeepMocked<UserMigrationService>;

	let testSystem: System;
	let testOauthConfig: OauthConfig;

	const hostUri = 'https://mock.de';

	beforeAll(async () => {
		orm = await setupEntities();

		jest.spyOn(Configuration, 'get').mockImplementation((key: string): unknown => {
			switch (key) {
				case 'HOST':
					return hostUri;
				default:
					throw new Error(`No mock for key '${key}'`);
			}
		});

		module = await Test.createTestingModule({
			providers: [
				OAuthService,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: FeathersJwtProvider,
					useValue: createMock<FeathersJwtProvider>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<IEncryptionService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: ProvisioningService,
					useValue: createMock<ProvisioningService>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: UserMigrationService,
					useValue: createMock<UserMigrationService>(),
				},
			],
		}).compile();
		service = module.get(OAuthService);

		oAuthEncryptionService = module.get(DefaultEncryptionService);
		provisioningService = module.get(ProvisioningService);
		userService = module.get(UserService);
		feathersJwtProvider = module.get(FeathersJwtProvider);
		httpService = module.get(HttpService);
		systemService = module.get(SystemService);
		userMigrationService = module.get(UserMigrationService);
	});

	afterAll(async () => {
		jest.clearAllMocks();
		await module.close();
		await orm.close();
	});

	beforeEach(() => {
		testSystem = systemFactory.withOauthConfig().buildWithId();
		testOauthConfig = testSystem.oauthConfig as OauthConfig;
	});

	describe('checkAuthorizationCode', () => {
		describe('when it gets passed a query with a code', () => {
			it('should extract code from query', () => {
				const code = '43534543jnj543342jn2';
				const query: AuthorizationParams = { code };

				const extract: string = service.checkAuthorizationCode(query);

				expect(extract).toBe(code);
			});
		});
		describe('when it gets passed a query with an error', () => {
			it('should throw an error', () => {
				const query: AuthorizationParams = { error: 'error' };

				expect(() => service.checkAuthorizationCode(query)).toThrow(
					new OAuthSSOError('Authorization Query Object has no authorization code or error', 'error')
				);
			});
		});

		describe('when it gets passed a faulty query', () => {
			it('should throw an error', () => {
				const query: AuthorizationParams = {};

				expect(() => service.checkAuthorizationCode(query)).toThrow(
					new OAuthSSOError('Authorization Query Object has no authorization code or error', 'sso_auth_code_step')
				);
			});
		});
	});
	describe('requestToken', () => {
		const code = '43534543jnj543342jn2';
		const tokenResponse: OauthTokenResponse = {
			access_token: 'accessToken',
			refresh_token: 'refreshToken',
			id_token: 'idToken',
		};

		beforeEach(() => {
			oAuthEncryptionService.decrypt.mockReturnValue('decryptedSecret');
			httpService.post.mockReturnValue(of(createAxiosResponse<OauthTokenResponse>(tokenResponse)));
		});
		describe('when it requests a token', () => {
			it('should get token from the external server', async () => {
				const responseToken: OauthTokenResponse = await service.requestToken(code, testOauthConfig);

				expect(responseToken).toStrictEqual(tokenResponse);
			});
		});

		describe('when no token got returned', () => {
			it('should throw an error', async () => {
				httpService.post.mockReturnValueOnce(throwError(() => 'error'));

				await expect(service.requestToken(code, testOauthConfig)).rejects.toEqual(
					new OAuthSSOError('Requesting token failed.', 'sso_auth_code_step')
				);
			});
		});
	});

	describe('_getPublicKey', () => {
		describe('when it requests a public key', () => {
			it('should get public key', async () => {
				const publicKey: string = await service._getPublicKey(testOauthConfig);

				expect(publicKey).toStrictEqual('publicKey');
			});
		});
	});
	describe('validateToken', () => {
		afterEach(() => {
			jest.clearAllMocks();
		});
		describe('when the token is validated', () => {
			it('should validate id_token and return it decoded', async () => {
				jest.spyOn(jwt, 'verify').mockImplementationOnce((): JwtPayload => {
					return { sub: 'mockSub' };
				});

				const decodedJwt: IJwt = await service.validateToken('idToken', testOauthConfig);

				expect(decodedJwt.sub).toStrictEqual('mockSub');
			});
		});

		describe('if no payload was returned', () => {
			it('should throw', async () => {
				jest.spyOn(jwt, 'verify').mockImplementationOnce((): string => 'string');

				await expect(service.validateToken('idToken', testOauthConfig)).rejects.toEqual(
					new OAuthSSOError('Failed to validate idToken', 'sso_token_verfication_error')
				);
			});
		});
	});
	describe('findUser', () => {
		const decodedJwtMock = { sub: new ObjectId().toHexString(), email: 'peter.tester@example.com' };
		beforeEach(() => {
			jest.spyOn(jwt, 'decode').mockImplementation((): JwtPayload => decodedJwtMock);
		});
		describe('findUser is called', () => {
			const setupJwt = () => {
				const decodedJwt: JwtPayload = {
					sub: new ObjectId().toHexString(),
					email: 'peter.tester@example.com',
				};

				jest.spyOn(jwt, 'decode').mockReturnValue(decodedJwt);

				return {
					decodedJwt,
				};
			};
			const setupUser = () => {
				const externalUserId = 'externalUserId';
				const user: UserDO = new UserDO({
					firstName: 'firstName',
					lastName: 'lastName',
					email: 'email',
					schoolId: 'schoolId',
					roleIds: ['roleId'],
					externalId: externalUserId,
				});
				return { externalUserId, user };
			};

			afterEach(() => {
				jest.clearAllMocks();
			});

			describe('when an external id is given', () => {
				it('should return the user according to the externalId', async () => {
					setupJwt();
					const { externalUserId, user } = setupUser();

					userService.findByExternalId.mockResolvedValue(user);

					const result: UserDO = await service.findUser('idToken', externalUserId, testSystem.id);

					expect(result).toEqual(user);
				});
			});

			describe('when no user is found with this id and give helpful context', () => {
				it('should throw', async () => {
					setupJwt();
					userService.findByExternalId.mockResolvedValueOnce(null);

					try {
						await service.findUser('accessToken', 'idToken', testSystem.id);
					} catch (error) {
						expect(error).toBeInstanceOf(OAuthSSOError);
						expect((error as OAuthSSOError).message).toContain('currentLdapId');
					}
				});
			});

			describe('when idToken is invalid and has no sub', () => {
				it('should throw', async () => {
					jest.spyOn(jwt, 'decode').mockImplementationOnce(() => null);

					await expect(service.findUser('accessToken', 'idToken', testSystem.id)).rejects.toThrow(BadRequestException);
				});
			});
			describe('when no user is found with this id', () => {
				it('should throw OAuthSSOError and give helpful context', async () => {
					setupJwt();
					const { externalUserId } = setupUser();
					const schoolId = new ObjectId().toHexString();
					userService.findByExternalId.mockResolvedValue(null);
					userService.findByEmail.mockResolvedValue([
						userFactory.buildWithId({
							school: schoolFactory.buildWithId(undefined, schoolId),
							externalId: externalUserId,
						}),
					]);

					const promise: Promise<UserDO> = service.findUser('idToken', externalUserId, testSystem.id);

					await expect(promise).rejects.toThrow(OAuthSSOError);
				});
			});

			describe('when the token has no email information', () => {
				it('should throw without additional information', async () => {
					const { decodedJwt } = setupJwt();
					jest.spyOn(jwt, 'decode').mockReturnValue({ ...decodedJwt, email: undefined });
					const externalUserId = '321-my-current-ldap-id';
					userService.findByExternalId.mockResolvedValue(null);

					const promise: Promise<UserDO> = service.findUser('idToken', externalUserId, testSystem.id);

					await expect(promise).rejects.toThrow(OAuthSSOError);
				});
			});

			describe('when the id token has no sub', () => {
				it('should throw BadRequestException', async () => {
					jest.spyOn(jwt, 'decode').mockReturnValue(null);

					await expect(service.findUser('accessToken', 'idToken', testSystem.id)).rejects.toThrow(BadRequestException);
				});
			});
		});
	});

	describe('getJwtForUser', () => {
		describe('when it is called', () => {
			it('should return a JWT for a user', async () => {
				const jwtToken = 'schulcloudJwt';

				feathersJwtProvider.generateJwt.mockResolvedValue(jwtToken);

				const jwtResult = await service.getJwtForUser('userId');

				expect(feathersJwtProvider.generateJwt).toHaveBeenCalled();
				expect(jwtResult).toStrictEqual(jwtToken);
			});
		});
	});

	describe('getRedirectUrl', () => {
		describe('when it is called with an iserv-provider', () => {
			it('should return an iserv login url string', () => {
				const url = service.getRedirectUrl('iserv', 'idToken', 'logoutEndpoint');

				expect(url).toStrictEqual(`logoutEndpoint?id_token_hint=idToken&post_logout_redirect_uri=${hostUri}/dashboard`);
			});
		});

		describe('when it is called with any other oauth provider', () => {
			it('should return a login url string', () => {
				const url: string = service.getRedirectUrl('provider');

				expect(url).toStrictEqual(`${hostUri}/dashboard`);
			});
		});
	});
	describe('getOAuthErrorResponse', () => {
		describe('when an OAuthSSOError is given', () => {
			it('should return a login url string within an error', () => {
				const specialError: OAuthSSOError = new OAuthSSOError('foo', 'special_error_code');

				const response = service.getOAuthErrorResponse(specialError, 'provider');

				expect(response.provider).toStrictEqual('provider');
				expect(response.errorCode).toStrictEqual('special_error_code');
				expect(response.redirect).toStrictEqual(`${hostUri}/login?error=special_error_code&provider=provider`);
			});
		});
		describe('when any other error is given', () => {
			it('should return a login url string within an error', () => {
				const generalError: Error = new Error('foo');

				const response: OAuthProcessDto = service.getOAuthErrorResponse(generalError, 'provider');

				expect(response.provider).toStrictEqual('provider');
				expect(response.errorCode).toStrictEqual('oauth_login_failed');
				expect(response.redirect).toStrictEqual(`${hostUri}/login?error=oauth_login_failed&provider=provider`);
			});
		});
	});
	describe('authenticateUser', () => {
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
			const mockUser: UserDO = new UserDO({
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

			const decodedJwtMock = { sub: new ObjectId().toHexString(), email: 'peter.tester@example.com' };

			systemService.findOAuthById.mockResolvedValue(system);
			provisioningService.getData.mockResolvedValue(oauthData);
			provisioningService.provisionData.mockResolvedValue(provisioningDto);
			jest.spyOn(jwt, 'decode').mockImplementation((): JwtPayload => decodedJwtMock);
			oAuthEncryptionService.decrypt.mockReturnValue('decryptedSecret');
			httpService.post.mockReturnValue(of(createAxiosResponse<OauthTokenResponse>(oauthTokenResponse)));

			return {
				query,
				system,
				externalUserId,
				mockUser,
				oauthData,
				oauthTokenResponse,
				provisioningDto,
				userJwt,
				oauthConfig,
				postLoginRedirect,
				successResponse,
			};
		};

		afterEach(() => {
			jest.clearAllMocks();
		});
		// const mockSystemDto: SystemDto = {};

		it('should authenticate a user', async () => {
			const { query, system, mockUser } = setup();
			systemService.findOAuthById.mockResolvedValueOnce(testSystem);
			userService.findByExternalId.mockResolvedValueOnce(mockUser);

			const { user, redirect } = await service.authenticateUser(query.code!, system.id!);
			expect(redirect).toStrictEqual(`${hostUri}/dashboard`);
			expect(user).toStrictEqual(mockUser);
		});

		describe('when system id does not exist (impossible case)', () => {
			it('the authentication should fail', async () => {
				const { query, mockUser } = setup();

				systemService.findOAuthById.mockResolvedValueOnce({} as SystemDto);
				userService.findByExternalId.mockResolvedValueOnce(mockUser);

				await expect(service.authenticateUser(query.code!, '')).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when system does not have oauth config', () => {
			it('the authentication should fail', async () => {
				const authCode = 'mockAuthCode';
				const externalId = new ObjectId().toHexString();
				const mockUser: UserDO = userDoFactory.buildWithId({ externalId });
				const testSystemWithoutConfig = systemFactory.buildWithId();
				systemService.findOAuthById.mockResolvedValueOnce(testSystemWithoutConfig);
				userService.findByExternalId.mockResolvedValueOnce(mockUser);

				await expect(service.authenticateUser(authCode, testSystem.id)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when the provisioning returns a school with an officialSchoolNumber', () => {
			const setupMigration = () => {
				const setupData = setup();
				const migrationRedirect = 'https://mock.de/dashboard';
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
				it('should return an OAuthProcessDto with a migration redirect url', async () => {
					const { query, migrationRedirect } = setupMigration();

					userService.findByExternalId.mockResolvedValue(null);
					userMigrationService.isSchoolInMigration.mockResolvedValue(true);

					const { redirect } = await service.authenticateUser(query.code!, 'brokenId');

					expect(redirect).toEqual(migrationRedirect);
				});
			});

			describe('when the school is currently migrating to another system and the user exists', () => {
				it('should should finish the process normally and return a valid jwt', async () => {
					const { query, mockUser, migrationRedirect } = setupMigration();

					userService.findByExternalId.mockResolvedValue(mockUser);
					userMigrationService.isSchoolInMigration.mockResolvedValue(true);

					const { user, redirect } = await service.authenticateUser(query.code!, 'brokenId');

					expect(redirect).toEqual(migrationRedirect);
					expect(user).toEqual(mockUser);
				});
			});

			describe('when the school is not in a migration to another system', () => {
				it('should should finish the process normally and return a valid jwt', async () => {
					const { query, mockUser, migrationRedirect } = setupMigration();

					userService.findByExternalId.mockResolvedValue(mockUser);
					userMigrationService.isSchoolInMigration.mockResolvedValue(false);

					const { user, redirect } = await service.authenticateUser(query.code!, 'brokenId');

					expect(redirect).toEqual(migrationRedirect);
					expect(user).toEqual(mockUser);
				});
			});
		});
	});
});
