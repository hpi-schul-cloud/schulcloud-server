import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { OauthController } from './oauth.controller';
import { OauthUc } from '../uc/oauth.uc';

describe('oauth controller', () => {
	it('should do something when some stuff happens', async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [OauthController],
			imports: [],
			providers: [
				{
					provide: OauthUc,
					useValue: {
						getUserForLdapId: () => {},
					},
				},
			],
		}).compile();

		const oauthController = module.get(OauthController);
		const response = { redirect: jest.fn() };
		await oauthController.getAuthorizationCode({ code: 'dummyCode' }, response, {
			query: { error: 'severe dummy error' },
		} as unknown as Request);
		expect(response.redirect).toBeCalledWith('https://google.de');
	});
});
