/* eslint-disable @typescript-eslint/unbound-method */
import { createMock } from '@golevelup/ts-jest';
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
	Configuration.set('HOST', 'https://mock.de');
	let controller: OauthSSOController;
	let oauthUc: OauthUc;
	const idToken = 'mockToken';
	const defaultJWT =
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ1dWlkIjoiMTIzIn0.H_iI0kYNrlAUtHfP2Db0EmDs4cH2SV9W-p7EU4K24bI';
	const iservRedirectMock = `logoutEndpointMock?id_token_hint=${defaultJWT}&post_logout_redirect_uri=${
		Configuration.get('HOST') as string
	}/dashboard`;

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
					redirect: `logoutEndpointMock?id_token_hint=${defaultJWT}&post_logout_redirect_uri=${
						Configuration.get('HOST') as string
					}/dashboard`,
				})),
			});
			const redirect = await controller.startOauthAuthorizationCodeFlow(query, res, system.id);
			const expected = [query, system.id];
			expect(oauthUc.startOauth).toHaveBeenCalledWith(...expected);
			expect(res.cookie).toBeCalledWith('jwt', '1111');
			expect(res.redirect).toBeCalledWith(iservRedirectMock);
		});
	});
});
