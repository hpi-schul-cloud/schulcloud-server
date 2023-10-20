import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacyLogger } from '@src/core/logger';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { OAuthGrantType } from '../interface/oauth-grant-type.enum';
import { AuthenticationCodeGrantTokenRequest, OauthTokenResponse } from './dto';
import { OauthAdapterService } from './oauth-adapter.service';

const publicKey = 'publicKey';

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
			getPublicKey: jest.fn().mockReturnValue(publicKey),
			rsaPublicKey: publicKey,
		}),
		getSigningKeys: jest.fn(),
	};
});

jest.mock('jsonwebtoken');

describe('OauthAdapterServive', () => {
	let module: TestingModule;
	let service: OauthAdapterService;
	let httpService: DeepMocked<HttpService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OauthAdapterService,
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();
		service = module.get(OauthAdapterService);
		httpService = module.get(HttpService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getPublicKey', () => {
		describe('when a public key is requested', () => {
			it('should return the public key', async () => {
				const resp = await service.getPublicKey('jwksEndpoint');

				expect(resp).toEqual(publicKey);
			});
		});
	});

	describe('sendRequestToken', () => {
		const tokenResponse: OauthTokenResponse = {
			access_token: 'accessToken',
			refresh_token: 'refreshToken',
			id_token: 'idToken',
		};
		const testPayload: AuthenticationCodeGrantTokenRequest = {
			client_id: 'testId',
			client_secret: 'testSercret',
			redirect_uri: 'testUri',
			grant_type: OAuthGrantType.AUTHORIZATION_CODE_GRANT,
			code: 'testCode',
		};

		beforeEach(() => {
			httpService.post.mockReturnValue(of(createAxiosResponse<OauthTokenResponse>(tokenResponse)));
		});

		describe('when it requests a token', () => {
			it('should get token from the external server', async () => {
				const responseToken: OauthTokenResponse = await service.sendAuthenticationCodeTokenRequest(
					'tokenEndpoint',
					testPayload
				);

				expect(responseToken).toStrictEqual(tokenResponse);
			});
		});

		describe('when no token got returned', () => {
			it('should throw an error', async () => {
				httpService.post.mockReturnValueOnce(throwError(() => 'error'));

				const resp = service.sendAuthenticationCodeTokenRequest('tokenEndpoint', testPayload);

				await expect(resp).rejects.toEqual(new OAuthSSOError('Requesting token failed.', 'sso_auth_code_step'));
			});
		});
	});
});
