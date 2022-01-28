import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '@src/core/logger';

import { UserRepo } from '@shared/repo/user/user.repo';
import { SystemRepo } from '@shared/repo/system';
import { EntityId, System, User, OauthConfig } from '@shared/domain';
import { FeathersJwtProvider } from '@src/modules/authorization';
import axios, { AxiosResponse } from 'axios';
import jwtDecode from 'jwt-decode';
import { ObjectId } from 'bson';
import { IJWT, OauthUc } from '.';
import { TokenRequestPayload } from '../controller/dto/token-request-payload';
import { OauthTokenResponse } from '../controller/dto/oauthTokenResponse';
import { TokenRequestParams } from '../controller/dto/token-request-params';

describe('OAuthUc', () => {
	let service: OauthUc;
	let userRepo: UserRepo;
	let systemRepo: SystemRepo;
	let jwtService: FeathersJwtProvider;

	const defaultAuthCode = '43534543jnj543342jn2';
	const defaultQuery = { code: defaultAuthCode };
	const defaultErrorQuery = { error: 'Default Error' };
	const defaultSystemId = '123456789';
	const defaultDate = new Date();
	const token =
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ1dWlkIjoxMjN9.BZN-sB8PQTfr-xdA1D2TAXWDLTI6fnBkCz_KfW3mCgk';
	const defaultOauthConfig: OauthConfig = {
		client_id: '12345',
		client_secret: 'mocksecret',
		token_endpoint: 'http://mock.de/mock/auth/public/mockToken',
		grant_type: 'authorization_code',
		token_redirect_uri: 'http://mockhost:3030/api/v3/oauth/testsystemId/token',
		scope: 'openid uuid',
		response_type: 'code',
		auth_endpoint: 'mock_auth_endpoint',
		auth_redirect_uri: '',
	};
	const defaultSystem: System = {
		type: 'iserv',
		oauthconfig: defaultOauthConfig,
		id: '',
		_id: new ObjectId(),
		createdAt: defaultDate,
		updatedAt: defaultDate,
	};
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

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [LoggerModule],
			providers: [
				OauthUc,
				{
					provide: SystemRepo,
					useValue: {
						findById(id: EntityId) {
							return defaultSystem;
						},
					},
				},
				{
					provide: UserRepo,
					useValue: {},
				},
				{
					provide: FeathersJwtProvider,
					useValue: {
						generateJwt(user: User) {
							return user;
						},
						// const jwt = (await this.jwtService.generateJwt(user.id)) as string;
					},
				},
			],
		}).compile();

		service = await module.resolve<OauthUc>(OauthUc);
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
			const extractCodeMock = jest.fn(() => 'mock-code');
			service.extractCode = extractCodeMock;
			const extract = service.extractCode(defaultQuery);
			expect(extract).toBeCalledWith('asdf');
		});
	});

	// DONE.
	describe('extractCode', () => {
		it('should extract code from query', () => {
			const extract = service.extractCode(defaultQuery);
			expect(extract).toBe(defaultAuthCode);
		});
		it('should throw an error from a query that contains an error', () => {
			expect(() => {
				return service.extractCode(defaultErrorQuery);
			}).toThrow(defaultErrorQuery.error);
		});
		it('should throw an error from a falsy query', () => {
			expect(() => {
				return service.extractCode({});
			}).toThrow(Error);
		});
	});

	// Done.
	describe('mapSystemConfigtoPayload', () => {
		it('should map config to payload ', () => {
			const payload = service.mapSystemConfigtoPayload(defaultSystem, defaultAuthCode);
			expect(payload).toBeDefined();
			expect(payload).toStrictEqual(defaultPayload);
		});
	});

	// TODO
	describe('requestToken', () => {
		it('should return refresh Token and access token ', async () => {
			const responseToken: AxiosResponse<OauthTokenResponse> = await axios.post(
				defaultPayload.token_endpoint,
				{},
				{ params: { ...defaultPayload.tokenRequestParams } }
			);
			expect(responseToken).toBeCalledWith(defaultSystem, defaultQuery.code);
			expect(responseToken.data.access_token).toBeDefined();
			expect(responseToken.data.id_token).toBeDefined();
		});
	});

	// TODO
	describe('decodeToken', () => {
		it('should get uuid from id_token', () => {
			// TODO
			const decodedJwt: IJWT = jwtDecode(token);
			expect(decodedJwt).toBeCalledWith(token);
			expect(decodedJwt.uuid).toBe('123');
		});
	});

	// TODO
	describe('findUserById', () => {
		it('should map config to payload ', () => {
			// TODO
			const payload = service.extractCode(defaultQuery);
			const code = '43534543jnj543342jn2';
		});
	});

	// TODO
	describe('getJWTForUser', () => {
		it('should map config to payload ', () => {
			// TODO
			const payload = service.extractCode(defaultQuery);
			const code = '43534543jnj543342jn2';
		});
	});
});
