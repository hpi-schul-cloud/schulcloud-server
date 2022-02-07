import { Test, TestingModule } from '@nestjs/testing';
import { response, Response } from 'express';
import { OauthSSOController } from './oauth-sso.controller';
import { OauthUc } from '../uc/oauth.uc';
import { AuthorizationQuery } from './dto/authorization.query';

describe('OAuthController', () => {
	let controller: OauthSSOController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [OauthSSOController],
			imports: [],
			providers: [
				{
					provide: OauthUc,
					useValue: {
						startOauth: (query, systemid) => {
							return response.redirect('www.mock.de');
						},
					},
				},
			],
		}).compile();

		controller = module.get(OauthSSOController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('startOauthAuthorizationCodeFlow', () => {
		const query: AuthorizationQuery = { code: 'qwertz' };
		const systemid = '98765';
		// const res = getMockRes();

		// it('should redirect to www.mock.de', async () => {
		// 	const redirect = await controller.startOauthAuthorizationCodeFlow(query, res, systemid);
		// 	const expected = [{ query }, { res }, { systemid }];
		// 	expect(redirect).toBeCalledWith(...expected);
		// });
	});
});
