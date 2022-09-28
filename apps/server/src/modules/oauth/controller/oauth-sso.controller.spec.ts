/* eslint-disable @typescript-eslint/unbound-method */
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { getMockRes } from '@jest-mock/express';
import { Test, TestingModule } from '@nestjs/testing';
import { System } from '@shared/domain';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { Logger } from '@src/core/logger';
import { OauthUc } from '../uc/oauth.uc';
import { AuthorizationParams } from './dto/authorization.params';
import { OauthSSOController } from './oauth-sso.controller';

describe('OAuthController', () => {
	let module: TestingModule;
	let controller: OauthSSOController;
	let oauthUc: DeepMocked<OauthUc>;

	const mockHost = 'https://mock.de';
	const defaultJWT = 'JWT_mock';
	const iservRedirectMock = `logoutEndpointMock?id_token_hint=${defaultJWT}&post_logout_redirect_uri=${mockHost}/dashboard`;

	const dateNow: Date = new Date('2020-01-01T00:00:00.000Z');
	const dateExpires: Date = new Date('2020-01-02T00:00:00.000Z');

	const cookieProperties = {
		expires: dateExpires,
		httpOnly: false,
		sameSite: 'lax',
		secure: false,
	};

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockImplementation((key: string) => {
			switch (key) {
				case 'HOST':
					return mockHost;
				case 'COOKIE__HTTP_ONLY':
					return cookieProperties.httpOnly;
				case 'COOKIE__SAME_SITE':
					return cookieProperties.sameSite;
				case 'COOKIE__SECURE':
					return cookieProperties.secure;
				case 'COOKIE__EXPIRES_SECONDS':
					return 86400000; // One day in ms
				default:
					return 'nonexistent case';
			}
		});
		jest.useFakeTimers('modern');
		jest.setSystemTime(dateNow);

		module = await Test.createTestingModule({
			controllers: [OauthSSOController],
			providers: [
				{
					provide: OauthUc,
					useValue: createMock<OauthUc>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		controller = module.get(OauthSSOController);
		oauthUc = module.get(OauthUc);
	});

	afterAll(async () => {
		await module.close();
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('startOauthFlow', () => {
		const defaultAuthCode = '43534543jnj543342jn2';
		const query: AuthorizationParams = { code: defaultAuthCode };
		const system: System = systemFactory.build();
		system.id = '4345345';

		it('should redirect to mock.de', async () => {
			const { res } = getMockRes();
			const expected = [query, system.id];
			oauthUc.processOAuth.mockResolvedValue({
				jwt: '1111',
				idToken: '2222',
				logoutEndpoint: 'https://iserv.n21.dbildungscloud.de/iserv/auth/logout',
				redirect: `logoutEndpointMock?id_token_hint=${defaultJWT}&post_logout_redirect_uri=${mockHost}/dashboard`,
				provider: 'iserv',
			});

			await controller.startOauthAuthorizationCodeFlow(query, res, { systemId: system.id });

			expect(oauthUc.processOAuth).toHaveBeenCalledWith(...expected);
			expect(res.cookie).toBeCalledWith('jwt', '1111', cookieProperties);
			expect(res.redirect).toBeCalledWith(iservRedirectMock);
		});
		it('should redirect to empty string', async () => {
			const { res } = getMockRes();
			oauthUc.processOAuth.mockResolvedValue({
				idToken: '2222',
				redirect: '',
				provider: 'iserv',
			});

			await controller.startOauthAuthorizationCodeFlow(query, res, { systemId: system.id });

			expect(res.cookie).toBeCalledWith('jwt', '', cookieProperties);
			expect(res.redirect).toBeCalledWith('');
		});
	});
});
