import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Collection } from '@mikro-orm/core';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { OauthConfig, Role, School, System, User } from '@shared/domain';
import { SystemRepo } from '@shared/repo/system';
import { UserRepo } from '@shared/repo/user/user.repo';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { Logger } from '@src/core/logger';
import { FeathersJwtProvider } from '@src/modules/authorization';
import { AxiosResponse } from 'axios';
import { ObjectId } from 'bson';
import jwt from 'jsonwebtoken';
import { of } from 'rxjs';
import { Configuration } from '@hpi-schul-cloud/commons';
import { schoolFactory } from '@shared/testing';
import { DefaultEncryptionService, SymetricKeyEncryptionService } from '@shared/infra/encryption';
import { AuthorizationParams } from '@src/modules/oauth/controller/dto/authorization.params';
import { ProvisioningUc } from '@src/modules/provisioning/uc/provisioning.uc';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { UnprocessableEntityException } from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { OauthTokenResponse } from '../controller/dto/oauth-token.response';
import { OAuthResponse } from './dto/oauth.response';
import { IJwt } from '../interface/jwt.base.interface';
import { OAuthSSOError } from '../error/oauth-sso.error';

jest.mock('jwks-rsa', () => {
	return () => ({
		getKeys: jest.fn(),
		getSigningKey: jest.fn().mockResolvedValue({
			kid: 'kid',
			alg: 'alg',
			getPublicKey: jest.fn().mockReturnValue('publicKey'),
			rsaPublicKey: 'publicKey',
		}),
		getSigningKeys: jest.fn(),
	});
});

describe('OAuthService', () => {
	let service: OAuthService;
	Configuration.set('HOST', 'https://mock.de');

	let defaultSystem: System;
	let defaultOauthConfig: OauthConfig;

	let defaultAuthCode: string;
	let defaultQuery: AuthorizationParams;
	let defaultErrorQuery: AuthorizationParams;
	let defaultUserId: string;
	let defaultSchool: School;
	let defaultDecodedJWT: IJwt;

	let defaultUser: User;
	let defaultIservUser: User;
	let defaultIservSystemId: string;
	let defaultJWT: string;
	let defaultTokenResponse: OauthTokenResponse;
	let defaultAxiosResponse: AxiosResponse<OauthTokenResponse>;

	let defaultDecryptedSecret: string;

	let iservRedirectMock: string;
	let defaultIservSystem: System;
	let defaultResponse: OAuthResponse;
	let defaultResponseAfterBuild;
	let defaultErrorRedirect: string;
	let defaultErrorResponse: OAuthResponse;

	let oAuthEncryptionService: DeepMocked<SymetricKeyEncryptionService>;
	let systemRepo: DeepMocked<SystemRepo>;
	let userRepo: DeepMocked<UserRepo>;
	let feathersJwtProvider: DeepMocked<FeathersJwtProvider>;
	let provisioningUc: DeepMocked<ProvisioningUc>;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [HttpModule],
			providers: [
				OAuthService,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: SymetricKeyEncryptionService,
					useValue: createMock<SymetricKeyEncryptionService>(),
				},
				{
					provide: ProvisioningUc,
					useValue: createMock<ProvisioningUc>(),
				},
				{
					provide: HttpService,
					useValue: {
						post: () => {
							if (defaultOauthConfig.grantType === 'grantMock') {
								return {};
							}
							return of(defaultAxiosResponse);
						},
					},
				},
				{
					provide: SystemRepo,
					useValue: createMock<SystemRepo>(),
				},
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: FeathersJwtProvider,
					useValue: createMock<FeathersJwtProvider>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<SymetricKeyEncryptionService>(),
				},
			],
		}).compile();
		service = module.get(OAuthService);

		oAuthEncryptionService = module.get(SymetricKeyEncryptionService);
		systemRepo = module.get(SystemRepo);
		userRepo = module.get(UserRepo);
		feathersJwtProvider = module.get(FeathersJwtProvider);
		provisioningUc = module.get(ProvisioningUc);

		jest.mock('axios', () =>
			jest.fn(() => {
				return Promise.resolve(defaultAxiosResponse);
			})
		);
	});

	beforeEach(() => {
		defaultSystem = systemFactory.withOauthConfig().build();
		defaultOauthConfig = defaultSystem.oauthConfig as OauthConfig;

		defaultAuthCode = '43534543jnj543342jn2';
		defaultQuery = { code: defaultAuthCode };
		defaultErrorQuery = { error: 'oauth_login_failed' };
		defaultUserId = '123456789';
		defaultSchool = schoolFactory.build();
		defaultDecodedJWT = {
			sub: '4444',
		};

		defaultUser = {
			email: '',
			roles: new Collection<Role>([]),
			school: defaultSchool,
			_id: new ObjectId(),
			id: '4444',
			createdAt: new Date(),
			updatedAt: new Date(),
			externalId: '1111',
			firstName: 'Test',
			lastName: 'Testmann',
		};
		defaultIservUser = {
			email: '',
			roles: new Collection<Role>([]),
			school: defaultSchool,
			_id: new ObjectId(),
			id: defaultUserId,
			createdAt: new Date(),
			updatedAt: new Date(),
			externalId: '3333',
			firstName: 'iservTest',
			lastName: 'Test',
		};
		defaultIservSystemId = '1234hasdhas8';
		defaultJWT =
			'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ1dWlkIjoiMTIzIn0.H_iI0kYNrlAUtHfP2Db0EmDs4cH2SV9W-p7EU4K24bI';
		defaultTokenResponse = {
			access_token: 'zzzz',
			refresh_token: 'zzzz',
			id_token: defaultJWT,
		};
		defaultAxiosResponse = {
			data: defaultTokenResponse,
			status: 0,
			statusText: '',
			headers: {},
			config: {},
		};

		defaultDecryptedSecret = 'IchBinNichtMehrGeheim';

		iservRedirectMock = `logoutEndpointMock?id_token_hint=${defaultJWT}&post_logout_redirect_uri=${
			Configuration.get('HOST') as string
		}/dashboard`;
		defaultIservSystem = {
			type: 'iserv',
			url: 'http://mock.de',
			provisioningUrl: 'mock_provisioning_url',
			alias: `system`,
			oauthConfig: {
				clientId: '12345',
				clientSecret: 'mocksecret',
				tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
				grantType: 'authorization_code',
				scope: 'openid uuid',
				responseType: 'code',
				authEndpoint: 'mock_authEndpoint',
				provider: 'iserv',
				logoutEndpoint: 'logoutEndpointMock',
				issuer: 'mock_issuer',
				jwksEndpoint: 'mock_jwksEndpoint',
				redirectUri: 'http://mockhost:3030/api/v3/oauth/testsystemId',
			},
			_id: new ObjectId(),
			id: '',
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		defaultResponse = {
			idToken: defaultJWT,
			logoutEndpoint: 'logoutEndpointMock',
			provider: 'providerMock',
			redirect: '',
		};
		defaultResponseAfterBuild = {
			idToken: defaultJWT,
			logoutEndpoint: 'logoutEndpointMock',
			provider: 'iserv',
		};
		defaultErrorRedirect = `${Configuration.get('HOST') as string}/login?error=${
			defaultErrorQuery.error as string
		}&provider=iserv`;
		defaultErrorResponse = new OAuthResponse();
		defaultErrorResponse.errorcode = defaultErrorQuery.error as string;
		defaultErrorResponse.redirect = defaultErrorRedirect;

		// Init mocks
		oAuthEncryptionService.decrypt.mockReturnValue(defaultDecryptedSecret);
		systemRepo.findById.mockResolvedValue(defaultIservSystem);
		userRepo.findById.mockImplementation((sub: string): Promise<User> => {
			if (sub === '') {
				throw new OAuthSSOError('Failed to find user with this Id', 'sso_user_notfound');
			}
			if (sub) {
				return Promise.resolve(defaultUser);
			}
			throw new OAuthSSOError('Failed to find user with this Id', 'sso_user_notfound');
		});
		feathersJwtProvider.generateJwt.mockResolvedValue(defaultJWT);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('checkAuthorizationCode', () => {
		it('should extract code from query', () => {
			const extract = service.checkAuthorizationCode(defaultQuery);
			expect(extract).toBe(defaultAuthCode);
		});
		it('should throw an error from a query that contains an error', () => {
			expect(() => {
				return service.checkAuthorizationCode(defaultErrorQuery);
			}).toThrow('Authorization Query Object has no authorization code or error');
		});
		it('should throw an error from a query with error', () => {
			expect(() => {
				return service.checkAuthorizationCode({ error: 'default_error' });
			}).toThrow(OAuthSSOError);
		});
		it('should throw an error from a falsy query', () => {
			expect(() => {
				return service.checkAuthorizationCode({});
			}).toThrow(OAuthSSOError);
		});
	});

	describe('requestToken', () => {
		it('should get token from the external server', async () => {
			const responseToken = await service.requestToken(defaultAuthCode, defaultOauthConfig);
			expect(responseToken).toStrictEqual(defaultTokenResponse);
		});
		it('should throw error if no token got returned', async () => {
			defaultOauthConfig.grantType = 'grantMock';
			await expect(service.requestToken(defaultAuthCode, defaultOauthConfig)).rejects.toEqual(
				new OAuthSSOError('Requesting token failed.', 'sso_auth_code_step')
			);
		});
	});

	describe('_getPublicKey', () => {
		it('should get public key from the external server', async () => {
			const publicKey = await service._getPublicKey(defaultOauthConfig);
			expect(publicKey).toStrictEqual('publicKey');
		});
	});

	describe('validateToken', () => {
		it('should validate id_token and return it decoded', async () => {
			jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
				return { sub: 'mockSub' };
			});
			service._getPublicKey = jest.fn().mockResolvedValue('publicKey');
			const decodedJwt: IJwt = await service.validateToken(defaultJWT, defaultOauthConfig);
			expect(decodedJwt.sub).toStrictEqual('mockSub');
		});
		it('should throw an error', async () => {
			jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
				return 'string';
			});
			service._getPublicKey = jest.fn().mockResolvedValue('publicKey');
			await expect(service.validateToken(defaultJWT, defaultOauthConfig)).rejects.toEqual(
				new OAuthSSOError('Failed to validate idToken', 'sso_token_verfication_error')
			);
		});
	});

	describe('findUser', () => {
		beforeEach(() => {
			jest.spyOn(jwt, 'decode').mockImplementation(() => {
				return { sub: new ObjectId().toHexString() };
			});
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

		it('should return the user according to the uuid(externalId)', async () => {
			// Arrange
			provisioningUc.process.mockResolvedValue({ externalUserId: new ObjectId().toHexString() });
			userRepo.findByExternalIdOrFail.mockResolvedValue(defaultIservUser);

			// Act
			const user: User = await service.findUser(
				defaultTokenResponse.access_token,
				defaultTokenResponse.id_token,
				defaultIservSystemId
			);

			// Assert
			expect(userRepo.findByExternalIdOrFail).toHaveBeenCalled();
			expect(user).toBe(defaultIservUser);
		});

		it('should return an error if no User is found with this Id', async () => {
			// Arrange
			userRepo.findByExternalIdOrFail.mockRejectedValueOnce(new Error('User not found'));

			// Act & Assert
			await expect(
				service.findUser(defaultTokenResponse.access_token, defaultTokenResponse.id_token, defaultSystem.id)
			).rejects.toThrow(OAuthSSOError);
		});

		it('should return the user according to the id', async () => {
			// Arrange
			const provisioning: ProvisioningDto = new ProvisioningDto({ externalUserId: new ObjectId().toHexString() });
			provisioningUc.process.mockResolvedValue(provisioning);
			userRepo.findByExternalIdOrFail.mockResolvedValue(defaultUser);

			// Act
			const user = await service.findUser(
				defaultTokenResponse.access_token,
				defaultTokenResponse.id_token,
				defaultSystem.id
			);

			// Assert
			expect(userRepo.findByExternalIdOrFail).toHaveBeenCalled();
			expect(user).toBe(defaultUser);
		});

		it('should throw if idToken is invalid and has no sub', async () => {
			// Arrange
			jest.spyOn(jwt, 'decode').mockImplementationOnce(() => {
				return null;
			});

			// Act & Assert
			await expect(
				service.findUser(defaultTokenResponse.access_token, defaultTokenResponse.id_token, defaultSystem.id)
			).rejects.toThrow(UnprocessableEntityException);
		});
	});

	describe('getJwtForUser', () => {
		it('should return a JWT for a user', async () => {
			const jwtResult = await service.getJwtForUser(defaultUser);
			expect(feathersJwtProvider.generateJwt).toHaveBeenCalled();
			expect(jwtResult).toStrictEqual(defaultJWT);
		});
	});
	describe('buildResponse', () => {
		it('should build the Response successfully', () => {
			const response = service.buildResponse(defaultIservSystem.oauthConfig as OauthConfig, defaultTokenResponse);
			expect(response).toEqual(defaultResponseAfterBuild);
		});
	});

	describe('processOAuth', () => {
		it('should do the process successfully and redirect to iserv', async () => {
			jest.spyOn(service, 'validateToken').mockResolvedValueOnce(defaultDecodedJWT);
			const response = await service.processOAuth(defaultQuery, defaultIservSystemId);
			expect(response.redirect).toStrictEqual(iservRedirectMock);
			expect(response.jwt).toStrictEqual(defaultJWT);
		});

		it('should return an error if processOAuth failed', async () => {
			const errorResponse = await service.processOAuth(defaultQuery, '');
			expect(errorResponse).toEqual(defaultErrorResponse);
		});

		it('should return a error response if processOAuth failed and the provider cannot be fetched from the system', async () => {
			// Arrange
			defaultIservSystem.oauthConfig = undefined;

			// Act
			const errorResponse = await service.processOAuth(defaultQuery, '');

			// Assert
			expect(errorResponse).toEqual(
				expect.objectContaining({
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					redirect: expect.stringContaining('provider=unknown-provider'),
				})
			);
		});

		it('should throw error if oauthconfig is missing', async () => {
			const system: System = systemFactory.buildWithId();
			systemRepo.findById.mockResolvedValueOnce(system);
			const response = await service.processOAuth(defaultQuery, system.id);
			expect(response).toEqual({
				errorcode: 'sso_internal_error',
				redirect: 'https://mock.de/login?error=sso_internal_error&provider=iserv',
			});
		});

		it('should throw if no system was found', async () => {
			// Arrange
			systemRepo.findById.mockRejectedValue('Not Found');

			// Act & Assert
			await expect(service.processOAuth(defaultQuery, 'unknown id')).rejects.toThrow(UnprocessableEntityException);
		});
	});

	describe('getRedirect', () => {
		it('should return a login url string', () => {
			const response = service.getRedirect(defaultResponse);
			expect(response.redirect).toStrictEqual(`${Configuration.get('HOST') as string}/dashboard`);
		});
		it('should return an iserv login url string', () => {
			defaultResponse.provider = 'iserv';
			const response = service.getRedirect(defaultResponse);
			expect(response.redirect).toStrictEqual(iservRedirectMock);
		});
	});

	describe('getOAuthError', () => {
		it('should return a login url string within an error', () => {
			const generalError = new Error('foo');
			const response = service.getOAuthError(generalError, defaultOauthConfig.provider);
			expect(response.redirect).toStrictEqual(
				`${Configuration.get('HOST') as string}/login?error=oauth_login_failed&provider=${defaultOauthConfig.provider}`
			);
		});
		it('should return a login url string within an error', () => {
			const specialError: OAuthSSOError = new OAuthSSOError('foo', 'bar');
			const response = service.getOAuthError(specialError, defaultOauthConfig.provider);
			expect(response.redirect).toStrictEqual(
				`${Configuration.get('HOST') as string}/login?error=${specialError.errorcode}&provider=${
					defaultOauthConfig.provider
				}`
			);
		});
	});
});
