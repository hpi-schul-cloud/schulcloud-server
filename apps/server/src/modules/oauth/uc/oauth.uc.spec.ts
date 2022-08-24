import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@src/core/logger';
import { OauthUc } from '.';
import { OAuthService } from '../service/oauth.service';
import { OAuthResponse } from '../service/dto/oauth.response';

describe('OAuthUc', () => {
	let service: OauthUc;
	let oauthService: DeepMocked<OAuthService>;

	const defaultQuery = { code: '43534543jnj543342jn2' };

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				OauthUc,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: OAuthService,
					useValue: createMock<OAuthService>(),
				},
			],
		}).compile();

		service = await module.get(OauthUc);
		oauthService = await module.get(OAuthService);
	});

	describe('startOauth', () => {
		it('should start the OAuth2.0 process and get a redirect', async () => {
			// Arrange
			const response: OAuthResponse = {
				idToken: 'idToken',
				logoutEndpoint: 'logoutEndpointMock',
				provider: 'providerMock',
				redirect: 'redirect',
			};
			oauthService.processOAuth.mockResolvedValue(response);

			// Act
			const result = await service.startOauth(defaultQuery, 'oauthSystemId');

			// Assert
			expect(result).toEqual(response);
		});

		it('should return a redirect with an error', async () => {
			// Arrange
			const response: OAuthResponse = {
				provider: 'providerMock',
				errorcode: 'oauth_login_failed',
				redirect: '',
			};
			oauthService.processOAuth.mockResolvedValue(response);

			// Act
			const result = await service.startOauth(defaultQuery, '');

			// Assert
			expect(result).toEqual(response);
		});
	});
});
