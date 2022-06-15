/* eslint-disable @typescript-eslint/unbound-method */
import { createMock } from '@golevelup/ts-jest';
import { Collection } from '@mikro-orm/core';
import { HttpModule, HttpService } from '@nestjs/axios';
import { NotFoundException } from '@nestjs/common';
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
import { OauthUc } from '.';
import { OauthTokenResponse } from '../controller/dto/oauth-token.response';
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

describe('OAuthUc', () => {
	let service: OauthUc;
	let userRepo: UserRepo;
	let systemRepo: SystemRepo;
	let jwtService: FeathersJwtProvider;

	const defaultAuthCode = '43534543jnj543342jn2';
	const defaultQuery = { code: defaultAuthCode };
	const defaultErrorQuery = { error: 'Default Error' };
	const defaultScool: School = {
		name: '',
		_id: new ObjectId(),
		id: '',
		systems: new Collection<System>([]),
	};
	const defaultUser: User = {
		email: '',
		roles: new Collection<Role>([]),
		school: defaultScool,
		_id: new ObjectId(),
		id: '',
		createdAt: new Date(),
		updatedAt: new Date(),
		ldapId: '1111',
		firstName: '',
		lastName: '',
	};
	const defaultUserId = '123456789';
	const defaultSystemId = '987654321';
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
	let systemMock: System;

	const defaultDecryptedSecret = 'IchBinNichtMehrGeheim';

	beforeEach(async () => {
		systemMock = systemFactory.build();
		const module: TestingModule = await Test.createTestingModule({
			imports: [HttpModule],
			providers: [
				OauthUc,
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
						findById: jest.fn(() => systemMock),
					},
				},
				{
					provide: UserRepo,
					useValue: {
						findByLdapId(userId, systemId) {
							if (userId === '') throw new NotFoundException();
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
			],
		}).compile();

		service = await module.resolve<OauthUc>(OauthUc);
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

	describe('startOauth', () => {
		it('should extract query to code as string', async () => {
			jest.spyOn(service, 'validateToken').mockResolvedValue({ uuid: '123' });
			const response = await service.startOauth(defaultQuery, defaultSystemId);
			expect(response).toEqual({ jwt: defaultJWT, idToken: defaultJWT, logoutEndpoint: 'mock_logoutEndpoint' });
		});

		it('should throw error if oauthconfig is missing', async () => {
			systemMock.oauthConfig = undefined;
			await expect(service.startOauth(defaultQuery, defaultSystemId)).rejects.toThrow(OAuthSSOError);
		});
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
			const responseToken = await service.requestToken(defaultAuthCode, defaultSystem.oauthConfig!);
			expect(responseToken).toStrictEqual(defaultTokenResponse);
		});
	});

	describe('_getPublicKey', () => {
		it('should get public key from the external server', async () => {
			const defaultSystem = systemFactory.build();
			const publicKey = await service._getPublicKey(defaultSystem.oauthConfig!);
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
			const decodedJwt = await service.validateToken(defaultJWT, defaultSystem.oauthConfig!);
			expect(decodedJwt.uuid).toStrictEqual('123456');
		});
		it('should throw an error', async () => {
			jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
				return 'string';
			});
			const defaultSystem = systemFactory.build();
			service._getPublicKey = jest.fn().mockResolvedValue('publicKey');
			await expect(service.validateToken(defaultJWT, defaultSystem.oauthConfig!)).rejects.toEqual(
				new OAuthSSOError('Failed to validate idToken', 'sso_token_verfication_error')
			);
		});
	});

	describe('extractUUID', () => {
		it('should get uuid from id_token', () => {
			const uuid: string = service.extractUUID({ uuid: '123' });
			expect(uuid).toStrictEqual('123');
		});

		it('should throw an error for id_token that does not exist an uuid', () => {
			expect(() => {
				const uuid: string = service.extractUUID({ uuid: '' });
				return uuid;
			}).toThrow(OAuthSSOError);
		});
	});

	describe('findUserById', () => {
		it('should return the user according to the uuid(LdapId)', async () => {
			const resolveUserSpy = jest.spyOn(userRepo, 'findByLdapId');
			const user: User = await service.findUserById(defaultUserId, defaultSystemId);
			expect(resolveUserSpy).toHaveBeenCalled();
			expect(user).toBe(defaultUser);
		});
		it('should return an error', async () => {
			await expect(service.findUserById('', '')).rejects.toEqual(
				new OAuthSSOError('Failed to find user with this ldapId', 'sso_user_notfound')
			);
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
});
