import { Test, TestingModule } from '@nestjs/testing';
import { OauthProviderUc } from '@src/modules/oauth-provider/uc/oauth-provider.uc';
import { createMock } from '@golevelup/ts-jest';
import { OauthProviderController } from './oauth-provider.controller';

describe('OauthProviderController', () => {
	let module: TestingModule;
	let controller: OauthProviderController;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OauthProviderController,
				{
					provide: OauthProviderUc,
					useValue: createMock<OauthProviderUc>(),
				},
			],
		}).compile();

		controller = module.get(OauthProviderController);
	});

	afterAll(async () => {
		await module.close();
	});

	// TODO remove after implementation
	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
