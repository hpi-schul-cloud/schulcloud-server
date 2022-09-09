import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@src/core/logger';
import { AuthorizationParams } from '@src/modules/oauth/controller/dto/index';
import { MikroORM, NotFoundError } from '@mikro-orm/core';
import { setupEntities, systemFactory, userFactory } from '@shared/testing/index';
import { System, User } from '@shared/domain/index';
import { SystemRepo } from '@shared/repo/index';
import { OauthUc } from '.';
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
		it('should do the process successfully', async () => {
			// Arrange
			const code = '43534543jnj543342jn2';
			const jwt = 'schulcloudJwt';
			const redirect = 'redirect';
			const baseResponse: OAuthResponse = {
				idToken: 'idToken',
				logoutEndpoint: 'logoutEndpoint',
				provider: 'provider',
				redirect,
			};
			const query: AuthorizationParams = { code };
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

			// Act
			const response: OAuthResponse = await service.processOAuth(query, testSystem.id);

			// Assert
			expect(response).toEqual(
				expect.objectContaining({
					jwt,
					...baseResponse,
				})
			);
			expect(response.jwt).toStrictEqual(jwt);
		});

		// TODO --------->
		it('should throw error if oauthconfig is missing', async () => {
			const system: System = systemFactory.buildWithId();
			systemRepo.findById.mockResolvedValueOnce(system);
			const response = await service.processOAuth(defaultQuery, system.id);
			expect(response).toEqual({
				errorcode: 'sso_internal_error',
				redirect: 'https://mock.de/login?error=sso_internal_error&provider=iserv',
			});
		});

		it('should return a error response if processOAuth failed and the provider cannot be fetched from the system', async () => {
			// Arrange
			defaultIservSystem.oauthConfig = undefined;

			// Act
			const errorResponse = await service.processOAuth(defaultQuery, '');

			// Assert
			expect(errorResponse).toEqual(
				expect.objectContaining({
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					redirect: expect.stringContaining('provider=unknown-provider'),
				})
			);
		});

		it('should throw if no system was found', async () => {
			// Arrange
			systemRepo.findById.mockRejectedValue(new NotFoundError('Not Found'));

			// Act & Assert
			await expect(service.processOAuth(defaultQuery, 'unknown id')).rejects.toThrow(NotFoundException);
		});
	});
});
