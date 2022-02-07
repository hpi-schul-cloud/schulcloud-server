/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getMockRes } from '@jest-mock/express';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { Configuration } from '@hpi-schul-cloud/commons';
import { OauthController } from './oauth.controller';
import { OauthUc } from '../uc/oauth.uc';
import { AuthorizationQuery } from './dto/authorization.query';

describe('OAuthController', () => {
	Configuration.set('HOST', 'https://mock.de');
	let controller: OauthController;
	let oauthUc: OauthUc;
	const generateMock = async (oauthUcMock) => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [OauthController],
			imports: [],
			providers: [
				{
					provide: OauthUc,
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					useValue: oauthUcMock,
				},
			],
		}).compile();

		controller = module.get(OauthController);
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
		const query: AuthorizationQuery = { code: defaultAuthCode };
		const system = systemFactory.build();
		system.id = '4345345';
		it('should redirect to mock.de', async () => {
			const { res } = getMockRes();
			await generateMock({
				startOauth: jest.fn(() => ({ jwt: '1111' })),
			});
			const redirect = await controller.startOauthFlow(query, res, system.id);
			const expected = [query, system.id];
			expect(oauthUc.startOauth).toHaveBeenCalledWith(...expected);
			expect(res.cookie).toBeCalledWith('jwt', '1111');
			expect(res.redirect).toBeCalledWith('https://mock.de/dashboard');
		});

		it('should handle errorcode', async () => {
			const { res } = getMockRes();
			await generateMock({
				startOauth: jest.fn(() => ({ errorcode: 'some-error-happend' })),
			});
			const redirect = await controller.startOauthFlow(query, res, system.id);
			const expected = [query, system.id];
			expect(oauthUc.startOauth).toHaveBeenCalledWith(...expected);
			expect(res.cookie).not.toHaveBeenCalled();
			expect(res.redirect).toBeCalledWith('https://mock.de/login?error=some-error-happend');
		});

		it('should handle thrown error', async () => {
			const { res } = getMockRes();
			await generateMock({
				startOauth: jest.fn(() => {
					throw new Error('something bad happened');
				}),
			});
			const redirect = await controller.startOauthFlow(query, res, system.id);
			const expected = [query, system.id];
			expect(oauthUc.startOauth).toHaveBeenCalledWith(...expected);
			expect(res.cookie).not.toHaveBeenCalled();
			expect(res.redirect).toBeCalledWith('https://mock.de/login?error=OauthLoginFailed');
		});
	});
});
