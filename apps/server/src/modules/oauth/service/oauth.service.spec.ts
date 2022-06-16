import { createMock } from '@golevelup/ts-jest';
import { Collection } from '@mikro-orm/core';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, School, System, User } from '@shared/domain';
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
	let userRepo: UserRepo;
	let systemRepo: SystemRepo;
	let jwtService: FeathersJwtProvider;
	let iservOAuthService: IservOAuthService;
	Configuration.set('HOST', 'https://mock.de');

	const defaultAuthCode = '43534543jnj543342jn2';
	const defaultQuery = { code: defaultAuthCode };
	const defaultErrorQuery = { error: 'oauth_login_failed' };
	const defaultUserId = '123456789';
	const defaultScool: School = {
		name: '',
		_id: new ObjectId(),
		id: '',
		systems: new Collection<System>([]),
	};
	const defaultDecodedJWT = {
		sub: '',
		uuid: '1111',
	};

	const defaultUser: User = {
		email: '',
		roles: new Collection<Role>([]),
		school: defaultScool,
		_id: new ObjectId(),
		id: defaultUserId,
		createdAt: new Date(),
		updatedAt: new Date(),
		ldapId: '1111',
		firstName: 'Test',
		lastName: 'Testmann',
	};
	const defaultIservUser: User = {
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

	const defaultSystemId = '987654321';
	const defaultIservSystemId = '2222';
	const defaultJWT =
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ1dWlkIjoiMTIzIn0.H_iI0kYNrlAUtHfP2Db0EmDs4cH2SV9W-p7EU4K24bI';
	const wrongJWT =
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
	const defaultTokenResponse: OauthTokenResponse = {
		access_token: 'zzzz',
		refresh_token: 'zzzz',
		id_token: defaultJWT,
	};
	const defaultAxiosResponse: AxiosResponse<OauthTokenResponse> = {
		data: defaultTokenResponse,
		status: 0,
		statusText: '',
		headers: {},
		config: {},
	};

	const defaultDecryptedSecret = 'IchBinNichtMehrGeheim';
	const decodedJWTMock: IJwt = {
		uuid: '1111',
		sub: ' ',
	};

	const defaultResponse: OAuthResponse = {
		idToken: defaultJWT,
		logoutEndpoint: 'logoutEndpointMock',
		provider: 'providerMock',
		redirect: '',
	};

	const iservRedirectMock = `logoutEndpointMock?id_token_hint=${defaultJWT}&post_logout_redirect_uri=${
		Configuration.get('HOST') as string
	}/dashboard`;
	const defaultIservSystem: System = {
		type: 'iserv',
		url: 'http://mock.de',
		alias: `system`,
		oauthConfig: {
			clientId: '12345',
			clientSecret: 'mocksecret',
			tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
			grantType: 'authorization_code',
			tokenRedirectUri: 'http://mockhost:3030/api/v3/oauth/testsystemId/token',
			scope: 'openid uuid',
			responseType: 'code',
			authEndpoint: 'mock_authEndpoint',
			provider: 'iserv',
			logoutEndpoint: 'logoutEndpointMock',
			issuer: 'mock_issuer',
			jwksEndpoint: 'mock_jwksEndpoint',
		},
		_id: new ObjectId(),
		id: '',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [HttpModule],
			providers: [
				OAuthService,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: 'OAuthEncryptionService',
					useValue: {
						decrypt: () => {
							return defaultDecryptedSecret;
						},
					},
				},
				{
					provide: HttpService,
					useValue: {
						post: () => {
							return of(defaultAxiosResponse);
						},
					},
				},
				{
					provide: SystemRepo,
					useValue: {
						findById: jest.fn((id: string) => {
							if (id === '2222') {
								return defaultIservSystem;
							}
							return systemFactory.build();
						}),
					},
				},
				{
					provide: UserRepo,
					useValue: {
						findById(sub: string) {
							return defaultUser;
						},
					},
				},
				{
					provide: FeathersJwtProvider,
					useValue: {
						generateJwt() {
							return defaultJWT;
						},
					},
				},
				{
					provide: IservOAuthService,
					useValue: {
						extractUUID(decodedJwt: IJwt) {
							return defaultDecodedJWT.uuid;
						},
						findUserById(uuid: string, systemId: string) {
							return defaultIservUser;
						},
					},
				},
			],
		}).compile();

		service = await module.resolve<OAuthService>(OAuthService);
		jest.mock('axios', () =>
			jest.fn(() => {
				return Promise.resolve(defaultAxiosResponse);
			})
		);
		userRepo = await module.resolve<UserRepo>(UserRepo);
		systemRepo = await module.resolve<SystemRepo>(SystemRepo);
		jwtService = await module.resolve<FeathersJwtProvider>(FeathersJwtProvider);
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
			const defaultSystem = systemFactory.build();
			const responseToken = await service.requestToken(defaultAuthCode, defaultSystem);
			expect(responseToken).toStrictEqual(defaultTokenResponse);
		});
	});

	describe('_getPublicKey', () => {
		it('should get public key from the external server', async () => {
			const defaultSystem = systemFactory.build();
			const publicKey = await service._getPublicKey(defaultSystem);
			expect(publicKey).toStrictEqual('publicKey');
		});
	});

	describe('validateToken', () => {
		it('should validate id_token and return it decoded', async () => {
			jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
				return { uuid: '123456' };
			});
			const defaultSystem = systemFactory.build();
			service._getPublicKey = jest.fn().mockResolvedValue('publicKey');
			const decodedJwt: IJwt = await service.validateToken(defaultJWT, defaultSystem);
			expect(decodedJwt.uuid).toStrictEqual('123456');
		});
		it('should throw an error', async () => {
			jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
				return 'string';
			});
			const defaultSystem = systemFactory.build();
			service._getPublicKey = jest.fn().mockResolvedValue('publicKey');
			await expect(service.validateToken(defaultJWT, defaultSystem)).rejects.toEqual(
				new OAuthSSOError('Failed to validate idToken', 'sso_token_verfication_error')
			);
		});
	});

	describe('findUser', () => {
		it('should return the user according to the id', async () => {
			const resolveUserSpy = jest.spyOn(userRepo, 'findById');
			const user: User = await service.findUser(defaultDecodedJWT, defaultSystemId);
			expect(resolveUserSpy).toHaveBeenCalled();
			expect(user).toBe(defaultUser);
		});
		it('should return the user according to the uuid(LdapId)', async () => {
			const user: User = await service.findUser(defaultDecodedJWT, defaultIservSystemId);
			expect(user).toBe(defaultIservUser);
		});
	});

	describe('getJWTForUser', () => {
		it('should return a JWT for a user', async () => {
			const resolveJWTSpy = jest.spyOn(jwtService, 'generateJwt');
			const jwtResult = await service.getJWTForUser(defaultUser);
			expect(resolveJWTSpy).toHaveBeenCalled();
			expect(jwtResult).toStrictEqual(defaultJWT);
		});
	});

	describe('processOauth', () => {
		it('should do the process successfully', async () => {
			jest.spyOn(service, 'validateToken').mockResolvedValue(decodedJWTMock);
			const response = await service.processOauth(defaultQuery, defaultIservSystemId);
			expect(response.redirect).toStrictEqual(iservRedirectMock);
			expect(response.jwt).toStrictEqual(defaultJWT);
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
			const response = service.getOAuthError(defaultErrorQuery.error);
			expect(response.redirect).toStrictEqual(
				`${Configuration.get('HOST') as string}/login?error=${defaultErrorQuery.error}`
			);
		});
		it('should return a login url string within an error', () => {
			const specialError: OAuthSSOError = new OAuthSSOError('foo', 'bar');
			const response = service.getOAuthError(specialError);
			expect(response.redirect).toStrictEqual(
				`${Configuration.get('HOST') as string}/login?error=${specialError.errorcode}`
			);
		});
	});
});
