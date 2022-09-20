import { Test, TestingModule } from '@nestjs/testing';
import { OauthProviderUc } from '@src/modules/oauth-provider/uc/oauth-provider.uc';
import { OauthProviderService } from '@shared/infra/oauth-provider/index';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

describe('OauthProviderUc', () => {
	let module: TestingModule;
	let uc: OauthProviderUc;
	let service: DeepMocked<OauthProviderService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OauthProviderUc,
				{
					provide: OauthProviderService,
					useValue: createMock<OauthProviderService>(),
				},
			],
		}).compile();

		uc = module.get(OauthProviderUc);
		service = module.get(OauthProviderService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('logoutFlow', () => {
		it('should call service', async () => {
			await uc.logoutFlow('challenge_mock');

			expect(service.acceptLogoutRequest).toHaveBeenCalledWith('challenge_mock');
		});
	});
});
