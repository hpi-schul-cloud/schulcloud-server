import { Test, TestingModule } from '@nestjs/testing';
import { response, Response } from 'express';
import { OauthController } from './oauth.controller';
import { OauthUc } from '../uc/oauth.uc';
import { AuthorizationQuery } from './dto/authorization.query';

describe('OAuthController', () => {
	let controller: OauthController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [OauthController],
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

		controller = module.get(OauthController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('startOauthFlow', () => {
		const query: AuthorizationQuery = { code: 'qwertz' };
		const systemid = '98765';
		// const res = getMockRes();

		// it('should redirect to www.mock.de', async () => {
		// 	const redirect = await controller.startOauthFlow(query, res, systemid);
		// 	const expected = [{ query }, { res }, { systemid }];
		// 	expect(redirect).toBeCalledWith(...expected);
		// });
	});
});
