import { Test, TestingModule } from '@nestjs/testing';
import { OauthController } from './oauth.controller';
import { OauthUc } from '../uc/oauth.uc';

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
						getUserForLdapId: () => {},
					},
				},
			],
		}).compile();

		controller = module.get(OauthController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
