import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@src/core/logger';
import { AuthorizationParams } from '@src/modules/oauth/controller/dto/index';
import { MikroORM, NotFoundError } from '@mikro-orm/core';
import { setupEntities, systemFactory, userFactory } from '@shared/testing/index';
import { System, User } from '@shared/domain/index';
import { SystemRepo } from '@shared/repo/index';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import { OauthUc } from '@src/modules/oauth/uc/oauth.uc';
import { OAuthService } from '../service/oauth.service';
import { OAuthResponse } from '../service/dto/oauth.response';

describe('OAuthUc', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let service: OauthUc;

	let oauthService: DeepMocked<OAuthService>;
	let systemRepo: DeepMocked<SystemRepo>;

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
					provide: SystemRepo,
					useValue: createMock<SystemRepo>(),
				},
				{
					provide: OAuthService,
					useValue: createMock<OAuthService>(),
				},
			],
		}).compile();

		service = await module.get(OauthUc);
		systemRepo = await module.get(SystemRepo);
		oauthService = await module.get(OAuthService);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	beforeEach(() => {
		testSystem = systemFactory.withOauthConfig().buildWithId();
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
			systemRepo.findById.mockResolvedValue(testSystem);
			oauthService.requestToken.mockResolvedValue({
				access_token: 'accessToken',
				refresh_token: 'refreshToken',
				id_token: 'idToken',
			});
			oauthService.validateToken.mockResolvedValue({ sub: 'sub' });
			oauthService.findUser.mockResolvedValue(user);
			oauthService.getJwtForUser.mockResolvedValue(jwt);
			oauthService.buildResponse.mockReturnValue(baseResponse);
			oauthService.getRedirectUrl.mockReturnValue(redirect);

			const response: OAuthResponse = await service.processOAuth(query, testSystem.id);

			expect(response).toEqual(
				expect.objectContaining({
					jwt,
					...baseResponse,
				})
			);
			expect(response.jwt).toStrictEqual(jwt);
		});

		it('should throw error if oauthconfig is missing', async () => {
			const system: System = systemFactory.buildWithId();
			const errorResponse: OAuthResponse = {
				provider: 'unknown-provider',
				errorcode: 'sso_internal_error',
				redirect: 'errorRedirect',
			};

			oauthService.checkAuthorizationCode.mockReturnValue(code);
			systemRepo.findById.mockResolvedValue(system);
			oauthService.getOAuthError.mockReturnValue(errorResponse);

			const response: OAuthResponse = await service.processOAuth(query, system.id);

			expect(oauthService.getOAuthError).toHaveBeenCalledWith(expect.any(Error), 'unknown-provider');
			expect(response).toEqual(errorResponse);
		});

		it('should return a error response if processOAuth failed and the provider cannot be fetched from the system', async () => {
			const system: System = systemFactory.withOauthConfig().buildWithId();
			const errorResponse: OAuthResponse = {
				provider: system.oauthConfig?.provider,
				errorcode: 'sso_internal_error',
				redirect: 'errorRedirect',
			} as OAuthResponse;

			oauthService.checkAuthorizationCode.mockImplementation(() => {
				throw new OAuthSSOError('Authorization Query Object has no authorization code or error', 'sso_auth_code_step');
			});
			systemRepo.findById.mockResolvedValue(system);
			oauthService.getOAuthError.mockReturnValue(errorResponse);

			const response: OAuthResponse = await service.processOAuth(query, '');

			expect(response).toEqual(errorResponse);
		});

		it('should throw if no system was found', async () => {
			oauthService.checkAuthorizationCode.mockImplementation(() => {
				throw new OAuthSSOError('Authorization Query Object has no authorization code or error', 'sso_auth_code_step');
			});
			systemRepo.findById.mockRejectedValue(new NotFoundError('Not Found'));

			await expect(service.processOAuth(query, 'unknown id')).rejects.toThrow(NotFoundError);
		});
	});
});
