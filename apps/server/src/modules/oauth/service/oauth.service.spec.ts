import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { MikroORM } from '@mikro-orm/core';
import { HttpService } from '@nestjs/axios';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OauthConfig, System } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { DefaultEncryptionService, IEncryptionService, SymetricKeyEncryptionService } from '@shared/infra/encryption';
import { schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { Logger } from '@src/core/logger';
import { FeathersJwtProvider } from '@src/modules/authorization';
import { AuthorizationParams } from '@src/modules/oauth/controller/dto/authorization.params';
import { AxiosResponse } from 'axios';
import { ObjectId } from 'bson';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { of, throwError } from 'rxjs';
import { UserService } from '../../user';
import { OauthTokenResponse } from '../controller/dto';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { IJwt } from '../interface/jwt.base.interface';
import { OAuthResponse } from './dto/oauth.response';
import { OAuthService } from './oauth.service';

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
	let userService: DeepMocked<UserService>;
	let feathersJwtProvider: DeepMocked<FeathersJwtProvider>;
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
			],
		}).compile();
		service = module.get(OAuthService);

		oAuthEncryptionService = module.get(DefaultEncryptionService);
		userService = module.get(UserService);
		feathersJwtProvider = module.get(FeathersJwtProvider);
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
			jest.spyOn(jwt, 'verify').mockImplementationOnce((): string => 'string');

			await expect(service.validateToken('idToken', testOauthConfig)).rejects.toEqual(
				new OAuthSSOError('Failed to validate idToken', 'sso_token_verfication_error')
			);
		});
	});

	describe('findUser', () => {
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

		afterEach(() => {
			jest.clearAllMocks();
		});

		it('should return the user according to the externalId', async () => {
			setupJwt();
			const externalUserId = 'externalUserId';
			const user: UserDO = new UserDO({
				firstName: 'firstName',
				lastName: 'lastName',
				email: 'email',
				schoolId: 'schoolId',
				roleIds: ['roleId'],
				externalId: externalUserId,
			});

			userService.findByExternalId.mockResolvedValue(user);

			const result: UserDO = await service.findUser('idToken', externalUserId, testSystem.id);

			expect(result).toEqual(user);
		});

		it('should throw if no user is found with this id and give helpful context', async () => {
			setupJwt();
			const schoolId = new ObjectId().toHexString();
			const externalUserId = '321-my-current-ldap-id';
			userService.findByExternalId.mockResolvedValue(null);
			userService.findByEmail.mockResolvedValue([
				userFactory.buildWithId({ school: schoolFactory.buildWithId(undefined, schoolId), externalId: externalUserId }),
			]);

			const promise: Promise<UserDO> = service.findUser('idToken', externalUserId, testSystem.id);

			await expect(promise).rejects.toThrow(OAuthSSOError);
			await expect(promise).rejects.toThrow(
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				expect.objectContaining<Partial<OAuthSSOError>>({
					// eslint-disable-next-line ,@typescript-eslint/no-unsafe-assignment
					message: expect.stringContaining(schoolId),
				})
			);
			await expect(promise).rejects.toThrow(
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				expect.objectContaining<Partial<OAuthSSOError>>({
					// eslint-disable-next-line ,@typescript-eslint/no-unsafe-assignment
					message: expect.stringContaining(externalUserId),
				})
			);
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

		it('should throw if idToken is invalid and has no sub', async () => {
			jest.spyOn(jwt, 'decode').mockReturnValue(null);

			await expect(service.findUser('accessToken', 'idToken', testSystem.id)).rejects.toThrow(BadRequestException);
		});
	});

	describe('getJwtForUser', () => {
		it('should return a JWT for a user', async () => {
			const jwtToken = 'schulcloudJwt';

			feathersJwtProvider.generateJwt.mockResolvedValue(jwtToken);

			const jwtResult = await service.getJwtForUser('userId');

			expect(feathersJwtProvider.generateJwt).toHaveBeenCalled();
			expect(jwtResult).toStrictEqual(jwtToken);
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

			const response: OAuthResponse = service.getOAuthErrorResponse(generalError, 'provider');

			expect(response.provider).toStrictEqual('provider');
			expect(response.errorCode).toStrictEqual('oauth_login_failed');
			expect(response.redirect).toStrictEqual(`${hostUri}/login?error=oauth_login_failed&provider=provider`);
		});

		it('should return a login url string within an error', () => {
			const specialError: OAuthSSOError = new OAuthSSOError('foo', 'special_error_code');

			const response = service.getOAuthErrorResponse(specialError, 'provider');

			expect(response.provider).toStrictEqual('provider');
			expect(response.errorCode).toStrictEqual('special_error_code');
			expect(response.redirect).toStrictEqual(`${hostUri}/login?error=special_error_code&provider=provider`);
		});
	});
});
