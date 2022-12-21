import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@src/core/logger';
import { AuthorizationParams } from '@src/modules/oauth/controller/dto/index';
import { MikroORM, NotFoundError } from '@mikro-orm/core';
import { setupEntities, systemFactory, userFactory } from '@shared/testing/index';
import { System, User } from '@shared/domain/index';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import { OauthUc } from '@src/modules/oauth/uc/oauth.uc';
import { SystemService } from '@src/modules/system/service/system.service';
import { OAuthService } from '../service/oauth.service';
import { OAuthResponse } from '../service/dto/oauth.response';
import resetAllMocks = jest.resetAllMocks;
import { FeathersJwtProvider } from '@src/modules/authorization/feathers-jwt.provider';
import { UserMapper } from '@src/modules/user/mapper/user.mapper';

describe('OAuthUc', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let service: OauthUc;

	let oauthService: DeepMocked<OAuthService>;
	let systemService: DeepMocked<SystemService>;
	let feathersJwtProvider: DeepMocked<FeathersJwtProvider>;

	let testSystem: System;

	beforeAll(async () => {
		orm = await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				OauthUc,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: OAuthService,
					useValue: createMock<OAuthService>(),
				},
				{
					provide: FeathersJwtProvider,
					useValue: createMock<FeathersJwtProvider>(),
				},
			],
		}).compile();

		service = await module.get(OauthUc);
		systemService = await module.get(SystemService);
		oauthService = await module.get(OAuthService);
		feathersJwtProvider = await module.get(FeathersJwtProvider);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	beforeEach(() => {
		testSystem = systemFactory.withOauthConfig().buildWithId();
	});

	afterEach(() => {
		resetAllMocks();
	});

	describe('processOAuth', () => {
		const code = '43534543jnj543342jn2';
		const query: AuthorizationParams = { code };

		it('should return a valid jwt', async () => {
			const jwt = 'schulcloudJwt';
			const redirect = 'redirect';
			const baseResponse: OAuthResponse = {
				idToken: 'idToken',
				logoutEndpoint: 'logoutEndpoint',
				provider: 'provider',
				redirect,
			};
			const user: User = userFactory.buildWithId();

			oauthService.checkAuthorizationCode.mockReturnValue(code);
			systemService.findOAuthById.mockResolvedValue(testSystem);
			oauthService.requestToken.mockResolvedValue({
				access_token: 'accessToken',
				refresh_token: 'refreshToken',
				id_token: 'idToken',
			});
			oauthService.validateToken.mockResolvedValue({ sub: 'sub' });
			oauthService.findUser.mockResolvedValue(user);
			oauthService.buildResponse.mockReturnValue(baseResponse);
			oauthService.getRedirectUrl.mockReturnValue(redirect);
			feathersJwtProvider.generateJwt.mockResolvedValue(jwt);

			const response: OAuthResponse = await service.processOAuth(query, testSystem.id);

			expect(response).toEqual(
				expect.objectContaining({
					jwt,
					...baseResponse,
				})
			);
			expect(response.jwt).toStrictEqual(jwt);
		});

		it('should oauthResponse with error when oauthconfig is missing', async () => {
			const system: System = systemFactory.buildWithId();
			const errorResponse: OAuthResponse = {
				provider: 'unknown-provider',
				errorcode: 'sso_internal_error',
				redirect: 'errorRedirect',
			};

			oauthService.checkAuthorizationCode.mockReturnValue(code);
			systemService.findOAuthById.mockResolvedValue(system);
			oauthService.getOAuthErrorResponse.mockReturnValue(errorResponse);

			const response: OAuthResponse = await service.processOAuth(query, system.id);

			expect(oauthService.getOAuthErrorResponse).toHaveBeenCalledWith(expect.any(Error), 'unknown-provider');
			expect(response).toEqual(errorResponse);
		});

		it('should return an error response that contains the provider when internal error occurred', async () => {
			const system: System = systemFactory.withOauthConfig().buildWithId();

			const errorResponse: OAuthResponse = {
				provider: system.oauthConfig?.provider,
				errorcode: 'sso_internal_error',
				redirect: 'errorRedirect',
			} as OAuthResponse;

			oauthService.checkAuthorizationCode.mockReturnValue(code);
			systemService.findOAuthById.mockResolvedValue(system);
			oauthService.requestToken.mockRejectedValue(new OAuthSSOError());
			oauthService.getOAuthErrorResponse.mockReturnValue(errorResponse);

			const response: OAuthResponse = await service.processOAuth(query, system.id);

			expect(oauthService.getOAuthErrorResponse).toHaveBeenCalledWith(expect.any(Error), system.oauthConfig?.provider);
			expect(response).toEqual(errorResponse);
		});

		it('should return an error response if processOAuth failed and the provider cannot be fetched from the system', async () => {
			const system: System = systemFactory.buildWithId();
			const errorResponse: OAuthResponse = {
				provider: 'unknown-provider',
				errorcode: 'sso_internal_error',
				redirect: 'errorRedirect',
			} as OAuthResponse;

			oauthService.checkAuthorizationCode.mockImplementation(() => {
				throw new OAuthSSOError('Authorization Query Object has no authorization code or error', 'sso_auth_code_step');
			});
			systemService.findOAuthById.mockResolvedValue(system);
			oauthService.getOAuthErrorResponse.mockReturnValue(errorResponse);

			const response: OAuthResponse = await service.processOAuth(query, '');

			expect(response).toEqual(errorResponse);
		});

		it('should throw if no system was found', async () => {
			oauthService.checkAuthorizationCode.mockImplementation(() => {
				throw new OAuthSSOError('Authorization Query Object has no authorization code or error', 'sso_auth_code_step');
			});
			systemService.findOAuthById.mockRejectedValue(new NotFoundError('Not Found'));

			await expect(service.processOAuth(query, 'unknown id')).rejects.toThrow(NotFoundError);
		});

		it('should throw if no system.id exist', async () => {
			const errorResponse: OAuthResponse = {
				provider: 'unknown-provider',
				errorcode: 'sso_internal_error',
				redirect: 'errorRedirect',
			} as OAuthResponse;
			oauthService.checkAuthorizationCode.mockReturnValue('ignore');
			systemService.findOAuthById.mockResolvedValue({ id: undefined, type: 'ignore' });
			oauthService.getOAuthErrorResponse.mockReturnValue(errorResponse);
			const response: OAuthResponse = await service.processOAuth(query, 'brokenId');
			expect(response).toEqual(errorResponse);
		});
	});
});
