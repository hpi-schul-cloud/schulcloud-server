/* eslint-disable @typescript-eslint/unbound-method */
import { createMock } from '@golevelup/ts-jest';
import { HttpModule } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@src/core/logger';
import { Configuration } from '@hpi-schul-cloud/commons';
import { OauthUc } from '.';
import { OAuthService } from '../service/oauth.service';
import { OAuthResponse } from '../service/dto/oauth.response';

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
	let oauthService: OAuthService;

	const defaultAuthCode = '43534543jnj543342jn2';
	const defaultQuery = { code: defaultAuthCode };
	const defaultErrorQuery = { error: 'Default Error' };
	const defaultSystemId = '987654321';
	const defaultIservSystemId = '2222';
	const defaultJWT =
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ1dWlkIjoiMTIzIn0.H_iI0kYNrlAUtHfP2Db0EmDs4cH2SV9W-p7EU4K24bI';
	const iservRedirectMock = `logoutEndpointMock?id_token_hint=${defaultJWT}&post_logout_redirect_uri=${
		Configuration.get('HOST') as string
	}/dashboard`;
	const defaultErrorRedirect = `${Configuration.get('HOST') as string}/login?error=${defaultErrorQuery.error}`;

	const defaultIservResponse: OAuthResponse = {
		idToken: defaultJWT,
		logoutEndpoint: 'logoutEndpointMock',
		provider: 'providerMock',
		redirect: iservRedirectMock,
	};
	const defaultResponse: OAuthResponse = {
		idToken: defaultJWT,
		logoutEndpoint: 'logoutEndpointMock',
		provider: 'providerMock',
		redirect: iservRedirectMock,
	};
	const defaultErrorResponse: OAuthResponse = {
		provider: 'providerMock',
		redirect: defaultErrorRedirect,
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [HttpModule],
			providers: [
				OauthUc,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: OAuthService,
					useValue: {
						processOAuth() {},
					},
				},
			],
		}).compile();

		service = await module.resolve<OauthUc>(OauthUc);
		oauthService = await module.resolve<OAuthService>(OAuthService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('startOauth', () => {
		it('should start the OAuth2.0 process and get a redirect ', async () => {
			jest.spyOn(oauthService, 'processOAuth').mockResolvedValue(defaultIservResponse);
			const response = await service.startOauth(defaultQuery, defaultIservSystemId);
			expect(response).toEqual(defaultIservResponse);
		});
		it('should start the OAuth2.0 process and get a redirect ', async () => {
			jest.spyOn(oauthService, 'processOAuth').mockResolvedValue(defaultResponse);
			const response = await service.startOauth(defaultQuery, defaultSystemId);
			expect(response).toEqual(defaultIservResponse);
		});

		it('should return a redirect with an error ', async () => {
			jest.spyOn(oauthService, 'processOAuth').mockResolvedValue(defaultErrorResponse);
			const response = await service.startOauth(defaultQuery, '');
			expect(response.redirect).toEqual(defaultErrorRedirect);
		});
	});
});
