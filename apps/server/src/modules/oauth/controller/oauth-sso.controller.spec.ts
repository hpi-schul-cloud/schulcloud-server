/* eslint-disable @typescript-eslint/unbound-method */
import { createMock } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { getMockRes } from '@jest-mock/express';
import { Test, TestingModule } from '@nestjs/testing';
import { System } from '@shared/domain';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { Logger } from '@src/core/logger';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { OauthUc } from '../uc/oauth.uc';
import { AuthorizationParams } from './dto/authorization.params';
import { OauthSSOController } from './oauth-sso.controller';

describe('OAuthController', () => {
	Configuration.set('HOST', 'https://mock.de');
	let controller: OauthSSOController;
	let oauthUc: OauthUc;
	const idToken = 'mockToken';

	const generateMock = async (oauthUcMock) => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [OauthSSOController],
			imports: [],
			providers: [
				{
					provide: OauthUc,
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					useValue: oauthUcMock,
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		controller = module.get(OauthSSOController);
		oauthUc = module.get(OauthUc);
	};

	it('should be defined', async () => {
		await generateMock({
			startOauth: jest.fn(),
		});
		expect(controller).toBeDefined();
	});

	describe('startOauthFlow', () => {
		const defaultAuthCode = '43534543jnj543342jn2';
		const query: AuthorizationParams = { code: defaultAuthCode };
		const system: System = systemFactory.build();
		system.id = '4345345';
		it('should redirect to mock.de', async () => {
			const { res } = getMockRes();
			await generateMock({
				startOauth: jest.fn(() => ({
					jwt: '1111',
					idToken: '2222',
					logoutEndpoint: 'https://iserv.n21.dbildungscloud.de/iserv/auth/logout',
				})),
			});
			const redirect = await controller.startOauthAuthorizationCodeFlow(query, res, system.id);
			const expected = [query, system.id];
			expect(oauthUc.startOauth).toHaveBeenCalledWith(...expected);
			expect(res.cookie).toBeCalledWith('jwt', '1111');
			expect(res.redirect).toBeCalledWith(
				'https://iserv.n21.dbildungscloud.de/iserv/auth/logout?id_token_hint=2222&post_logout_redirect_uri=https://mock.de/dashboard'
			);
		});

		it('should handle errorcode', async () => {
			const { res } = getMockRes();
			await generateMock({
				startOauth: jest.fn(() => ({ errorcode: 'some-error-happend' })),
			});
			const redirect = await controller.startOauthAuthorizationCodeFlow(query, res, system.id);
			const expected = [query, system.id];
			expect(oauthUc.startOauth).toHaveBeenCalledWith(...expected);
			expect(res.cookie).not.toHaveBeenCalled();
			expect(res.redirect).toBeCalledWith('https://mock.de/login?error=some-error-happend');
		});

		it('should handle thrown OAuthSSOError', async () => {
			const { res } = getMockRes();
			await generateMock({
				startOauth: jest.fn(() => {
					throw new OAuthSSOError('something bad happened', 'oauth_login_failed');
				}),
			});
			const redirect = await controller.startOauthAuthorizationCodeFlow(query, res, system.id);
			const expected = [query, system.id];
			expect(oauthUc.startOauth).toHaveBeenCalledWith(...expected);
			expect(res.cookie).not.toHaveBeenCalled();
			expect(res.redirect).toBeCalledWith('https://mock.de/login?error=oauth_login_failed');
		});

		it('should handle any thrown error', async () => {
			const { res } = getMockRes();
			await generateMock({
				startOauth: jest.fn(() => {
					throw new Error('something bad happened');
				}),
			});
			const redirect = await controller.startOauthAuthorizationCodeFlow(query, res, system.id);
			const expected = [query, system.id];
			expect(oauthUc.startOauth).toHaveBeenCalledWith(...expected);
			expect(res.cookie).not.toHaveBeenCalled();
			expect(res.redirect).toBeCalledWith('https://mock.de/login?error=oauth_login_failed');
		});
	});
});
