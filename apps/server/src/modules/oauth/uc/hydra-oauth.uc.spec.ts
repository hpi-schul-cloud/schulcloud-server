import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { HydraSsoService, OAuthService } from '@modules/oauth';
import { HydraRedirectDto } from '@modules/oauth/service/dto/hydra.redirect.dto';
import { HttpModule } from '@nestjs/axios';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OauthConfigEntity } from '@shared/domain/entity';
import { axiosResponseFactory } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { AxiosResponse } from 'axios';
import { HydraOauthUc } from '.';
import { AuthorizationParams } from '../controller/dto';
import { StatelessAuthorizationParams } from '../controller/dto/stateless-authorization.params';
import { OAuthTokenDto } from '../interface';
import { AuthCodeFailureLoggableException } from '../loggable';

class HydraOauthUcSpec extends HydraOauthUc {
	public validateStatusSpec = (status: number) => this.validateStatus(status);
}

describe('HydraOauthUc', () => {
	let module: TestingModule;
	let uc: HydraOauthUcSpec;

	let hydraOauthService: DeepMocked<HydraSsoService>;
	let oauthService: DeepMocked<OAuthService>;
	const oauthTokenDto: OAuthTokenDto = {
		accessToken: 'accessTockenMock',
		refreshToken: 'refreshTokenMock',
		idToken: 'idTokenMock',
	};
	const defaultDecodedJWT = {
		sub: 'subMock',
	};

	const JWTMock = 'jwtMock';
	const oauthClientId = 'oauthClientIdMock';
	const hydraUri = 'hydraUri';
	const apiHost = 'apiHost';
	const nextcloudScopes = 'nextcloudscope';
	const hydraOauthConfig = new OauthConfigEntity({
		authEndpoint: `${hydraUri}/oauth2/auth`,
		clientId: 'toolClientId',
		clientSecret: 'toolSecret',
		grantType: 'authorization_code',
		issuer: `${hydraUri}/`,
		jwksEndpoint: `${hydraUri}/.well-known/jwks.json`,
		logoutEndpoint: `${hydraUri}/oauth2/sessions/logout`,
		provider: 'hydra',
		redirectUri: `${apiHost}/v3/sso/hydra/ltiToolIdMock`,
		responseType: 'code',
		scope: 'openid offline others',
		tokenEndpoint: `${hydraUri}/oauth2/token`,
	});

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockImplementation((key: string): unknown => {
			switch (key) {
				case 'HYDRA_PUBLIC_URI':
					return hydraUri;
				case 'HOST':
					return apiHost;
				case 'NEXTCLOUD_SCOPES':
					return nextcloudScopes;
				default:
					return '';
			}
		});

		module = await Test.createTestingModule({
			imports: [HttpModule],
			providers: [
				HydraOauthUcSpec,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: HydraSsoService,
					useValue: createMock<HydraSsoService>(),
				},
				{
					provide: OAuthService,
					useValue: createMock<OAuthService>(),
				},
			],
		}).compile();

		uc = await module.get(HydraOauthUcSpec);
		hydraOauthService = await module.get(HydraSsoService);
		oauthService = await module.get(OAuthService);
	});

	afterAll(async () => {
		jest.clearAllMocks();
		await module.close();
	});

	describe('getOauthToken', () => {
		describe('when a code was provided', () => {
			it('should return the oauth token response', async () => {
				const code = 'kdjiqwjdjnq';

				hydraOauthService.generateConfig.mockResolvedValue(hydraOauthConfig);
				oauthService.requestToken.mockResolvedValue(oauthTokenDto);
				oauthService.validateToken.mockResolvedValue(defaultDecodedJWT);

				const oauthToken = await uc.getOauthToken('oauthClientId', code);

				expect(oauthToken).toEqual(oauthTokenDto);
			});

			it('should throw error', async () => {
				const error = 'kdjiqwjdjnq';

				const func = () => uc.getOauthToken('4566456', undefined, error);

				await expect(func).rejects.toThrow(new AuthCodeFailureLoggableException(error));
			});
		});

		describe('when an error was provided', () => {
			it('should throw OAuthSSOError', async () => {
				const error = 'error';

				hydraOauthService.generateConfig.mockResolvedValue(hydraOauthConfig);
				oauthService.requestToken.mockResolvedValue(oauthTokenDto);
				oauthService.validateToken.mockResolvedValue(defaultDecodedJWT);

				const func = async () => uc.getOauthToken('oauthClientId', undefined, error);

				await expect(func).rejects.toThrow(new AuthCodeFailureLoggableException(error));
			});
		});
	});

	describe('requestAuthCode', () => {
		let expectedAuthParams: StatelessAuthorizationParams;
		let axiosResponse1: AxiosResponse;
		let axiosResponse2: AxiosResponse;
		let responseDto1: HydraRedirectDto;
		let responseDto2: HydraRedirectDto;

		beforeAll(() => {
			expectedAuthParams = {
				code: 'defaultAuthCode',
			};
			const axiosConfig = {
				withCredentials: true,
				maxRedirects: 0,
				validateStatus: jest.fn().mockImplementationOnce(() => true),
			};
			axiosResponse1 = axiosResponseFactory.build({
				data: expectedAuthParams,
				status: 302,
				statusText: '',
				headers: {
					location: '/some/where',
					Referer: 'hydra',
				},
				config: axiosConfig,
			});
			axiosResponse2 = axiosResponseFactory.build({
				data: expectedAuthParams,
				status: 200,
				statusText: '',
				headers: {
					location: Configuration.get('HYDRA_PUBLIC_URI') as string,
					Referer: 'hydra',
				},
				config: axiosConfig,
			});
			responseDto1 = {
				axiosConfig,
				cookies: { localCookies: [], hydraCookies: [] },
				currentRedirect: 0,
				referer: '',
				response: axiosResponse1,
			};
			responseDto2 = {
				axiosConfig,
				cookies: { localCookies: [], hydraCookies: [] },
				currentRedirect: 0,
				referer: '',
				response: axiosResponse2,
			};
		});

		it('should return the authorizationcode', async () => {
			hydraOauthService.generateConfig.mockResolvedValue(hydraOauthConfig);
			hydraOauthService.initAuth.mockResolvedValue(axiosResponse1);
			hydraOauthService.processRedirect.mockResolvedValueOnce(responseDto1);
			hydraOauthService.processRedirect.mockResolvedValueOnce(responseDto2);

			const authParams: AuthorizationParams = await uc.requestAuthCode(JWTMock, oauthClientId);

			expect(authParams).toStrictEqual(expectedAuthParams);
			expect(hydraOauthService.processRedirect).toBeCalledTimes(2);
		});
		it('should throw InternalServerErrorException', async () => {
			hydraOauthService.generateConfig.mockResolvedValue(hydraOauthConfig);
			hydraOauthService.initAuth.mockResolvedValue(axiosResponse1);
			hydraOauthService.processRedirect.mockImplementation((dto) => {
				dto.currentRedirect += 1;
				return Promise.resolve(dto);
			});

			await expect(uc.requestAuthCode(JWTMock, oauthClientId)).rejects.toThrow(InternalServerErrorException);
		});
	});

	describe('validateStatus', () => {
		it('should return true for 302', () => {
			const ret: boolean = uc.validateStatusSpec(302);

			expect(ret).toEqual(true);
		});
		it('should return true for 200', () => {
			const ret: boolean = uc.validateStatusSpec(200);

			expect(ret).toEqual(true);
		});
		it('should return false for 400', () => {
			const ret: boolean = uc.validateStatusSpec(400);

			expect(ret).toEqual(false);
		});
	});
});
