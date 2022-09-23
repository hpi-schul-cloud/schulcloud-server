import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Collection } from '@mikro-orm/core';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { OauthConfig, Role, School, System, User } from '@shared/domain';
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
import { SystemService } from '@src/modules/system/service/system.service';
import { SystemMapper } from '@src/modules/system/mapper/system.mapper';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { NotFoundException } from '@nestjs/common';
import { IservOAuthService } from './iserv-oauth.service';
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
	let defaultScool: School;
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
	let systemService: DeepMocked<SystemService>;
	let userRepo: DeepMocked<UserRepo>;
	let feathersJwtProvider: DeepMocked<FeathersJwtProvider>;
	let iservOAuthService: DeepMocked<IservOAuthService>;

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
					provide: SystemService,
					useValue: createMock<SystemService>(),
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
					provide: IservOAuthService,
					useValue: createMock<IservOAuthService>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<SymetricKeyEncryptionService>(),
				},
			],
		}).compile();
		service = module.get(OAuthService);

		oAuthEncryptionService = module.get(SymetricKeyEncryptionService);
		systemService = module.get(SystemService);
		userRepo = module.get(UserRepo);
		feathersJwtProvider = module.get(FeathersJwtProvider);
		iservOAuthService = module.get(IservOAuthService);

		jest.mock('axios', () =>
			jest.fn(() => {
				return Promise.resolve(defaultAxiosResponse);
			})
		);
	});

	beforeEach(() => {
		defaultSystem = systemFactory.withOauthConfig().build();
		defaultOauthConfig = defaultSystem.oauthConfig as OauthConfig;
		defaultSystem.id = '1';

		defaultAuthCode = '43534543jnj543342jn2';
		defaultQuery = { code: defaultAuthCode };
		defaultErrorQuery = { error: 'oauth_login_failed' };
		defaultUserId = '123456789';
		defaultScool = schoolFactory.build();
		defaultDecodedJWT = {
			sub: '4444',
			uuid: '1111',
		};

		defaultUser = {
			email: '',
			roles: new Collection<Role>([]),
			school: defaultScool,
			_id: new ObjectId(),
			id: '4444',
			createdAt: new Date(),
			updatedAt: new Date(),
			ldapId: '1111',
			firstName: 'Test',
			lastName: 'Testmann',
		};
		defaultIservUser = {
			email: '',
			roles: new Collection<Role>([]),
			school: defaultScool,
			_id: new ObjectId(),
			id: defaultUserId,
			createdAt: new Date(),
			updatedAt: new Date(),
			ldapId: '3333',
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
			alias: `system`,
			oauthConfig: new OauthConfig({
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
			}),
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
		}&provider=${defaultOauthConfig.provider}`;
		defaultErrorResponse = new OAuthResponse();
		defaultErrorResponse.errorcode = defaultErrorQuery.error as string;
		defaultErrorResponse.redirect = defaultErrorRedirect;

		// Init mocks
		oAuthEncryptionService.decrypt.mockReturnValue(defaultDecryptedSecret);
		systemService.findById.mockImplementation((id: string): Promise<SystemDto> => {
			if (id === defaultIservSystemId) {
				return Promise.resolve(SystemMapper.mapFromEntityToDto(defaultIservSystem));
			}
			return Promise.resolve(SystemMapper.mapFromEntityToDto(systemFactory.withOauthConfig().build()));
		});
		systemService.findOAuthById.mockImplementation((id: string): Promise<SystemDto> => {
			if (id === defaultIservSystemId) {
				return Promise.resolve(SystemMapper.mapFromEntityToDto(defaultIservSystem));
			}
			return Promise.resolve(SystemMapper.mapFromEntityToDto(systemFactory.withOauthConfig().build()));
		});
		userRepo.findById.mockImplementation((sub: string): Promise<User> => {
			if (sub === '' || sub === 'extern') {
				throw new OAuthSSOError('Failed to find user with this Id', 'sso_user_notfound');
			}
			if (sub) {
				return Promise.resolve(defaultUser);
			}
			throw new OAuthSSOError('Failed to find user with this Id', 'sso_user_notfound');
		});
		userRepo.findByLdapIdOrFail.mockImplementation((sub: string, systemId: string): Promise<User> => {
			if (sub === '' || systemId === '') {
				throw new OAuthSSOError('Failed to find user with this Id', 'sso_user_notfound');
			}
			if (sub) {
				return Promise.resolve(defaultUser);
			}
			throw new OAuthSSOError('Failed to find user with this Id', 'sso_user_notfound');
		});
		feathersJwtProvider.generateJwt.mockResolvedValue(defaultJWT);
		iservOAuthService.extractUUID.mockReturnValue(defaultDecodedJWT.uuid);
		iservOAuthService.findUserById.mockResolvedValue(defaultIservUser);
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
				return { uuid: '123456' };
			});
			service._getPublicKey = jest.fn().mockResolvedValue('publicKey');
			const decodedJwt: IJwt = await service.validateToken(defaultJWT, defaultOauthConfig);
			expect(decodedJwt.uuid).toStrictEqual('123456');
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
		let oauthConfig: OauthConfig;

		beforeEach(() => {
			oauthConfig = defaultIservSystem.oauthConfig as OauthConfig;
		});

		it('should return the user according to the uuid(LdapId)', async () => {
			const user: User = await service.findUser(defaultDecodedJWT, oauthConfig, defaultIservSystemId);

			// Assert
			expect(iservOAuthService.findUserById).toHaveBeenCalled();
			expect(user).toBe(defaultIservUser);
		});
		it('should return the user according to the id', async () => {
			oauthConfig.provider = 'sanis';

			const user = await service.findUser(defaultDecodedJWT, oauthConfig, defaultSystem.id);

			expect(userRepo.findById).toHaveBeenCalled();
			expect(user).toBe(defaultUser);
		});
		it('should return the user by its external id, if local was not successful', async () => {
			defaultDecodedJWT.sub = 'extern';
			defaultDecodedJWT.preferred_username = 'extern';
			const user = await service.findUser(defaultDecodedJWT, defaultOauthConfig, defaultSystem.id);
			expect(userRepo.findByLdapIdOrFail).toHaveBeenCalled();
			expect(user).toBe(defaultUser);
		});
		it('should return an error if no User is found by this Id', async () => {
			oauthConfig.provider = 'sanis';
			defaultDecodedJWT.sub = '';
			await expect(service.findUser(defaultDecodedJWT, oauthConfig, defaultSystem.id)).rejects.toThrow(OAuthSSOError);
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
			expect(response.redirect).toStrictEqual(defaultErrorRedirect);
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

	describe('getOAuthConfig', () => {
		it('should return an OauthConfig', async () => {
			const response: OauthConfig = await service.getOauthConfig('');
			expect(response.clientId).toEqual('12345');
		});
		it('should throw a NotFoundException', async () => {
			const system = systemFactory.build();
			systemService.findById.mockResolvedValue(system);
			await expect(service.getOauthConfig(system.id)).rejects.toThrow(NotFoundException);
		});
	});
});
