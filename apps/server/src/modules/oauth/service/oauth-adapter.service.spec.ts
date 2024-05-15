import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory, axiosErrorFactory } from '@shared/testing/factory';
import { AxiosError } from 'axios';
import { of, throwError } from 'rxjs';
import { OAuthTokenDto } from '../interface';
import { OAuthGrantType } from '../interface/oauth-grant-type.enum';
import { TokenRequestLoggableException } from '../loggable';
import { AuthenticationCodeGrantTokenRequest, OauthTokenResponse } from './dto';
import { OauthAdapterService } from './oauth-adapter.service';

const publicKey = 'publicKey';

const createAxiosResponse = <T>(data: T) =>
	axiosResponseFactory.build({
		data,
	});

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

	describe('sendTokenRequest', () => {
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
				const responseToken: OAuthTokenDto = await service.sendTokenRequest('tokenEndpoint', testPayload);

				expect(responseToken).toEqual<OAuthTokenDto>({
					idToken: tokenResponse.id_token,
					accessToken: tokenResponse.access_token,
					refreshToken: tokenResponse.refresh_token,
				});
			});
		});

		describe('when no token got returned', () => {
			const setup = () => {
				const error = new Error('unknown error');
				httpService.post.mockReturnValueOnce(throwError(() => error));

				return {
					error,
				};
			};

			it('should throw an error', async () => {
				const { error } = setup();

				const resp = service.sendTokenRequest('tokenEndpoint', testPayload);

				await expect(resp).rejects.toEqual(error);
			});
		});

		describe('when error got returned', () => {
			describe('when error is a unknown error', () => {
				const setup = () => {
					const error = new Error('unknown error');
					httpService.post.mockReturnValueOnce(throwError(() => error));

					return {
						error,
					};
				};

				it('should throw the default sso error', async () => {
					const { error } = setup();

					const resp = service.sendTokenRequest('tokenEndpoint', testPayload);

					await expect(resp).rejects.toEqual(error);
				});
			});

			describe('when error is a axios error', () => {
				const setup = () => {
					const error = {
						error: 'invalid_request',
					};
					const axiosError: AxiosError = axiosErrorFactory.withError(error).build();

					httpService.post.mockReturnValueOnce(throwError(() => axiosError));

					return {
						axiosError,
					};
				};

				it('should throw an error', async () => {
					const { axiosError } = setup();

					const resp = service.sendTokenRequest('tokenEndpoint', testPayload);

					await expect(resp).rejects.toEqual(new TokenRequestLoggableException(axiosError));
				});
			});
		});
	});
});
