import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM, NotFoundError } from '@mikro-orm/core';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { OauthConfig, System, User } from '@shared/domain';
import { UserRepo } from '@shared/repo/user/user.repo';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { Logger } from '@src/core/logger';
import { FeathersJwtProvider } from '@src/modules/authorization';
import { AxiosResponse } from 'axios';
import { ObjectId } from 'bson';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { of, throwError } from 'rxjs';
import { Configuration } from '@hpi-schul-cloud/commons';
import { setupEntities, userFactory } from '@shared/testing';
import { DefaultEncryptionService, IEncryptionService, SymetricKeyEncryptionService } from '@shared/infra/encryption';
import { AuthorizationParams } from '@src/modules/oauth/controller/dto/authorization.params';
import { BadRequestException } from '@nestjs/common';
import { ProvisioningDto, ProvisioningService } from '@src/modules/provisioning';
import { OAuthService } from './oauth.service';
import { OauthTokenResponse } from '../controller/dto/oauth-token.response';
import { OAuthResponse } from './dto/oauth.response';
import { IJwt } from '../interface/jwt.base.interface';
import { OAuthSSOError } from '../error/oauth-sso.error';

const createAxiosResponse = <T = unknown>(data: T): AxiosResponse<T> => {
	return {
		data,
		status: 0,
		statusText: '',
		headers: {},
		config: {},
	};
};

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
	let module: TestingModule;
	let orm: MikroORM;
	let service: OAuthService;

	let oAuthEncryptionService: DeepMocked<SymetricKeyEncryptionService>;
	let userRepo: DeepMocked<UserRepo>;
	let feathersJwtProvider: DeepMocked<FeathersJwtProvider>;
	let provisioningService: DeepMocked<ProvisioningService>;
	let httpService: DeepMocked<HttpService>;

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
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
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
			],
		}).compile();
		service = module.get(OAuthService);

		oAuthEncryptionService = module.get(DefaultEncryptionService);
		userRepo = module.get(UserRepo);
		feathersJwtProvider = module.get(FeathersJwtProvider);
		provisioningService = module.get(ProvisioningService);
		httpService = module.get(HttpService);
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
		it('should extract code from query', () => {
			const code = '43534543jnj543342jn2';
			const query: AuthorizationParams = { code };

			const extract: string = service.checkAuthorizationCode(query);

			expect(extract).toBe(code);
		});

		it('should throw an error from a query that contains an error', () => {
			const query: AuthorizationParams = { error: 'error' };

			expect(() => service.checkAuthorizationCode(query)).toThrow(
				new OAuthSSOError('Authorization Query Object has no authorization code or error', 'error')
			);
		});

		it('should throw an error from a falsy query', () => {
			const query: AuthorizationParams = {};

			expect(() => service.checkAuthorizationCode(query)).toThrow(
				new OAuthSSOError('Authorization Query Object has no authorization code or error', 'sso_auth_code_step')
			);
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

		it('should get token from the external server', async () => {
			const responseToken: OauthTokenResponse = await service.requestToken(code, testOauthConfig);

			expect(responseToken).toStrictEqual(tokenResponse);
		});

		it('should throw error if no token got returned', async () => {
			httpService.post.mockReturnValueOnce(throwError(() => 'error'));

			await expect(service.requestToken(code, testOauthConfig)).rejects.toEqual(
				new OAuthSSOError('Requesting token failed.', 'sso_auth_code_step')
			);
		});
	});

	describe('_getPublicKey', () => {
		it('should get public key from the external server', async () => {
			const publicKey: string = await service._getPublicKey(testOauthConfig);

			expect(publicKey).toStrictEqual('publicKey');
		});
	});

	describe('validateToken', () => {
		afterEach(() => {
			jest.clearAllMocks();
		});

		it('should validate id_token and return it decoded', async () => {
			jest.spyOn(jwt, 'verify').mockImplementationOnce((): JwtPayload => {
				return { sub: 'mockSub' };
			});

			const decodedJwt: IJwt = await service.validateToken('idToken', testOauthConfig);

			expect(decodedJwt.sub).toStrictEqual('mockSub');
		});

		it('should throw if no payload was returned', async () => {
			jest.spyOn(jwt, 'verify').mockImplementationOnce((): string => {
				return 'string';
			});

			await expect(service.validateToken('idToken', testOauthConfig)).rejects.toEqual(
				new OAuthSSOError('Failed to validate idToken', 'sso_token_verfication_error')
			);
		});
	});

	describe('findUser', () => {
		beforeEach(() => {
			jest.spyOn(jwt, 'decode').mockImplementation((): JwtPayload => {
				return { sub: new ObjectId().toHexString() };
			});
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

		it('should return the user according to the externalId', async () => {
			const externalId = new ObjectId().toHexString();
			const user: User = userFactory.buildWithId({ externalId });

			provisioningService.process.mockResolvedValue({ externalUserId: externalId });
			userRepo.findByExternalIdOrFail.mockResolvedValue(user);

			const result: User = await service.findUser('accessToken', 'idToken', testSystem.id);

			expect(userRepo.findByExternalIdOrFail).toHaveBeenCalled();
			expect(result).toBe(user);
		});

		it('should throw if no user is found with this id', async () => {
			userRepo.findByExternalIdOrFail.mockRejectedValue(new NotFoundError('User not found'));

			await expect(service.findUser('accessToken', 'idToken', testSystem.id)).rejects.toThrow(OAuthSSOError);
		});

		it('should return the user according to the id', async () => {
			const externalId: string = new ObjectId().toHexString();
			const user: User = userFactory.buildWithId({ externalId });
			const provisioning: ProvisioningDto = new ProvisioningDto({ externalUserId: externalId });

			provisioningService.process.mockResolvedValue(provisioning);
			userRepo.findByExternalIdOrFail.mockResolvedValue(user);

			const result: User = await service.findUser('accessToken', 'idToken', testSystem.id);

			expect(userRepo.findByExternalIdOrFail).toHaveBeenCalled();
			expect(result).toBe(user);
		});

		it('should throw if idToken is invalid and has no sub', async () => {
			jest.spyOn(jwt, 'decode').mockImplementationOnce(() => {
				return null;
			});

			await expect(service.findUser('accessToken', 'idToken', testSystem.id)).rejects.toThrow(BadRequestException);
		});
	});

	describe('getJwtForUser', () => {
		it('should return a JWT for a user', async () => {
			const jwtToken = 'schulcloudJwt';
			const user: User = userFactory.buildWithId();

			feathersJwtProvider.generateJwt.mockResolvedValue(jwtToken);

			const jwtResult = await service.getJwtForUser(user);

			expect(feathersJwtProvider.generateJwt).toHaveBeenCalled();
			expect(jwtResult).toStrictEqual(jwtToken);
		});
	});

	describe('buildResponse', () => {
		it('should build the Response successfully', () => {
			const tokenResponse: OauthTokenResponse = {
				access_token: 'accessToken',
				refresh_token: 'refreshToken',
				id_token: 'idToken',
			};

			const response: OAuthResponse = service.buildResponse(testOauthConfig, tokenResponse);

			expect(response).toEqual({
				idToken: tokenResponse.id_token,
				logoutEndpoint: testOauthConfig.logoutEndpoint,
				provider: testOauthConfig.provider,
			});
		});
	});

	describe('getRedirect', () => {
		it('should return a login url string', () => {
			const url: string = service.getRedirectUrl('provider');

			expect(url).toStrictEqual(`${hostUri}/dashboard`);
		});

		it('should return an iserv login url string', () => {
			const url = service.getRedirectUrl('iserv', 'idToken', 'logoutEndpoint');

			expect(url).toStrictEqual(`logoutEndpoint?id_token_hint=idToken&post_logout_redirect_uri=${hostUri}/dashboard`);
		});
	});

	describe('getOAuthError', () => {
		it('should return a login url string within an error', () => {
			const generalError: Error = new Error('foo');

			const response: OAuthResponse = service.getOAuthError(generalError, 'provider');

			expect(response.provider).toStrictEqual('provider');
			expect(response.errorcode).toStrictEqual('oauth_login_failed');
			expect(response.redirect).toStrictEqual(`${hostUri}/login?error=oauth_login_failed&provider=provider`);
		});

		it('should return a login url string within an error', () => {
			const specialError: OAuthSSOError = new OAuthSSOError('foo', 'special_error_code');

			const response = service.getOAuthError(specialError, 'provider');

			expect(response.provider).toStrictEqual('provider');
			expect(response.errorcode).toStrictEqual('special_error_code');
			expect(response.redirect).toStrictEqual(`${hostUri}/login?error=special_error_code&provider=provider`);
		});
	});
});
