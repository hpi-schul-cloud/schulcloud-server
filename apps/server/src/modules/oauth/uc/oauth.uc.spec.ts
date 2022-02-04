import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '@src/core/logger';

import { UserRepo } from '@shared/repo/user/user.repo';
import { SystemRepo } from '@shared/repo/system';
import { User, School, Role } from '@shared/domain';
import { FeathersJwtProvider } from '@src/modules/authorization';
import { AxiosResponse } from 'axios';
import { ObjectId } from 'bson';
import { Collection } from '@mikro-orm/core';
import { HttpModule, HttpService } from '@nestjs/axios';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { OauthUc } from '.';
import { TokenRequestPayload } from '../controller/dto/token-request-payload';
import { OauthTokenResponse } from '../controller/dto/oauth-token-response';
import { TokenRequestParams } from '../controller/dto/token-request-params';

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
	};
	const defaultUserId = '123456789';
	const defaultDate = new Date();
	const defaultJWT =
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ1dWlkIjoiMTIzIn0.H_iI0kYNrlAUtHfP2Db0EmDs4cH2SV9W-p7EU4K24bI';
	const wrongJWT =
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
	const defaultPayloadData: TokenRequestParams = {
		code: defaultAuthCode,
		client_id: '12345',
		client_secret: 'mocksecret',
		grant_type: 'authorization_code',
		redirect_uri: 'http://mockhost:3030/api/v3/oauth/testsystemId/token',
	};
	const defaultPayload: TokenRequestPayload = {
		token_endpoint: 'http://mock.de/mock/auth/public/mockToken',
		tokenRequestParams: defaultPayloadData,
	};
	const defaultTokenResponse: OauthTokenResponse = {
		access_token: '',
		refresh_token: '',
		id_token: 'zzzz',
	};
	const defaultAxiosResponse: AxiosResponse<OauthTokenResponse> = {
		data: defaultTokenResponse,
		status: 0,
		statusText: '',
		headers: {},
		config: {},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [LoggerModule, HttpModule],
			providers: [
				OauthUc,
				{
					provide: 'OAuthEncryptionService',
					useValue: {
						// TODO
					},
				},
				{
					provide: HttpService,
					useValue: {
						post: () => {
							return defaultAxiosResponse;
						},
						// TODO
					},
				},
				{
					provide: SystemRepo,
					useValue: {
						findById(id: string) {
							return systemFactory.build();
						},
					},
				},
				{
					provide: UserRepo,
					useValue: {
						findByLdapId(id: string) {
							return defaultUser;
						},
					},
				},
				{
					provide: FeathersJwtProvider,
					useValue: {
						generateJwt(user: User) {
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

	// TODO ALOT ALOT
	describe('startOauth', () => {
		it('should extract query to code as string', () => {
			const checkAuthorizationCodeMock = jest.fn(() => 'mock-code');
			service.checkAuthorizationCode = checkAuthorizationCodeMock;
			const extract = service.checkAuthorizationCode(defaultQuery);
			const checkDecodeTokenMock = jest.fn(() => 'mock-code');
			service.decodeToken = checkDecodeTokenMock;
			// service.startOauth(defaultQuery, defaultSystem.id);
		});
	});

	// DONE.
	describe('checkAuthorizationCode', () => {
		it('should extract code from query', () => {
			const extract = service.checkAuthorizationCode(defaultQuery);
			expect(extract).toBe(defaultAuthCode);
		});
		it('should throw an error from a query that contains an error', () => {
			expect(() => {
				return service.checkAuthorizationCode(defaultErrorQuery);
			}).toThrow(defaultErrorQuery.error);
		});
		it('should throw an error from a falsy query', () => {
			expect(() => {
				return service.checkAuthorizationCode({});
			}).toThrow(Error);
		});
	});

	// DONE
	describe('decodeToken', () => {
		it('should get uuid from id_token', () => {
			const uuid: string = service.decodeToken(defaultJWT);
			expect(uuid).toStrictEqual('123');
		});

		it('should throw an error for id_token that does not exist an uuid', () => {
			expect(() => {
				const uuid: string = service.decodeToken(wrongJWT);
				return uuid;
			}).toThrow(Error);
		});
	});

	// Think DONE
	describe('findUserById', () => {
		it('should return the user according to the uuid(LdapId)', async () => {
			const resolveUserSpy = jest.spyOn(userRepo, 'findByLdapId');
			const user: User = await service.findUserById(defaultUserId);
			expect(resolveUserSpy).toHaveBeenCalled();
			expect(user).toBe(defaultUser);
		});
	});
	// TODO
	describe('getJWTForUser', () => {
		it('should return a JWT for a user', async () => {
			// TODO
			const resolveJWTSpy = jest.spyOn(jwtService, 'generateJwt');
			const jwt = await service.getJWTForUser(defaultUser);
			expect(resolveJWTSpy).toHaveBeenCalled();
			expect(jwt).toStrictEqual(defaultJWT);
		});
	});
});
