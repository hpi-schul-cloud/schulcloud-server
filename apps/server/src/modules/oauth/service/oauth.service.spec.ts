import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { MikroORM } from '@mikro-orm/core';
import { HttpService } from '@nestjs/axios';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser, OauthConfig, System } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { DefaultEncryptionService, IEncryptionService, SymetricKeyEncryptionService } from '@shared/infra/encryption';
import { schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { Logger } from '@src/core/logger';
import { UserService } from '@src/modules/user';
import { AxiosResponse } from 'axios';
import { ObjectId } from 'bson';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { of, throwError } from 'rxjs';
import { AuthenticationService } from '../../authentication/services/authentication.service';
import { OauthTokenResponse } from '../controller/dto';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { IJwt } from '../interface/jwt.base.interface';
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
	let authenticationService: DeepMocked<AuthenticationService>;
	let httpService: DeepMocked<HttpService>;

	let testSystem: System;
	let testOauthConfig: OauthConfig;

	const hostUri = 'http://mockhost.de';

	beforeAll(async () => {
		orm = await setupEntities();

		jest.spyOn(Configuration, 'get').mockImplementation((key: string): unknown => {
			switch (key) {
				case 'HOST':
				case 'BACKEND_HOST':
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
					provide: AuthenticationService,
					useValue: createMock<AuthenticationService>(),
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
		authenticationService = module.get(AuthenticationService);
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

		afterEach(() => {
			jest.clearAllMocks();
		});

		describe('when an external id is given', () => {
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
		});

		describe('when no user is found with this id', () => {
			it('should throw OAuthSSOError and give helpful context', async () => {
				setupJwt();
				const schoolId = new ObjectId().toHexString();
				const externalUserId = '321-my-current-ldap-id';
				userService.findByExternalId.mockResolvedValue(null);
				userService.findByEmail.mockResolvedValue([
					userFactory.buildWithId({
						school: schoolFactory.buildWithId(undefined, schoolId),
						externalId: externalUserId,
					}),
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

	describe('getJwtForUser is called', () => {
		describe('when a jwt is requested', () => {
			it('should return a JWT for a user', async () => {
				const jwtToken = 'schulcloudJwt';
				const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;

				userService.getResolvedUser.mockResolvedValue(currentUser);
				authenticationService.generateJwt.mockResolvedValue({ accessToken: jwtToken });

				const jwtResult = await service.getJwtForUser('userId');

				expect(authenticationService.generateJwt).toHaveBeenCalled();
				expect(jwtResult).toStrictEqual(jwtToken);
			});
		});
	});

	describe('getRedirectUrl is called', () => {
		describe('when the provider is iserv', () => {
			it('should return an iserv logout url', () => {
				const url = service.getRedirectUrl('iserv', 'idToken', 'http://iserv.logout');

				expect(url).toStrictEqual(
					`http://iserv.logout/?id_token_hint=idToken&post_logout_redirect_uri=http%3A%2F%2Fmockhost.de%2Fdashboard`
				);
			});
		});

		describe('when a normal provider and a postLoginRedirect are provided', () => {
			it('should return a login url string', () => {
				const url: string = service.getRedirectUrl('provider', '', '', 'specialPostLoginRedirectUrl');

				expect(url).toStrictEqual('specialPostLoginRedirectUrl');
			});
		});

		describe('when a normal provider is provided and no postLoginRedirect', () => {
			it('should return a login url string', () => {
				const url: string = service.getRedirectUrl('provider');

				expect(url).toStrictEqual(`${hostUri}/dashboard`);
			});
		});
	});

	describe('getAuthenticationUrl is called', () => {
		describe('when a normal authentication url is requested', () => {
			it('should return a authentication url', () => {
				const oauthConfig: OauthConfig = new OauthConfig({
					clientId: '12345',
					clientSecret: 'mocksecret',
					tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
					grantType: 'authorization_code',
					redirectUri: 'http://mockhost:3030/api/v3/sso/oauth/testsystemId',
					scope: 'openid uuid',
					responseType: 'code',
					authEndpoint: 'http://mock.de/auth',
					provider: 'mock_type',
					logoutEndpoint: 'http://mock.de/logout',
					issuer: 'mock_issuer',
					jwksEndpoint: 'http://mock.de/jwks',
				});

				const result: string = service.getAuthenticationUrl(oauthConfig, 'state', false);

				expect(result).toEqual(
					'http://mock.de/auth?client_id=12345&redirect_uri=http%3A%2F%2Fmockhost.de%2Fapi%2Fv3%2Fsso%2Foauth&response_type=code&scope=openid+uuid&state=state'
				);
			});
		});

		describe('when a migration authentication url is requested', () => {
			it('should return a authentication url', () => {
				const oauthConfig: OauthConfig = new OauthConfig({
					clientId: '12345',
					clientSecret: 'mocksecret',
					tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
					grantType: 'authorization_code',
					redirectUri: 'http://mockhost.de/api/v3/sso/oauth/testsystemId',
					scope: 'openid uuid',
					responseType: 'code',
					authEndpoint: 'http://mock.de/auth',
					provider: 'mock_type',
					logoutEndpoint: 'http://mock.de/logout',
					issuer: 'mock_issuer',
					jwksEndpoint: 'http://mock.de/jwks',
				});

				const result: string = service.getAuthenticationUrl(oauthConfig, 'state', true);

				expect(result).toEqual(
					'http://mock.de/auth?client_id=12345&redirect_uri=http%3A%2F%2Fmockhost.de%2Fapi%2Fv3%2Fsso%2Foauth%2Fmigration&response_type=code&scope=openid+uuid&state=state'
				);
			});
		});
	});
});
