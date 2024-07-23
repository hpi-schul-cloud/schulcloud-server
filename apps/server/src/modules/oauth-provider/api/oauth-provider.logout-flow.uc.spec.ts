import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ProviderRedirectResponse } from '../domain';
import { OauthProviderService } from '../domain/service/oauth-provider.service';
import { OauthProviderLogoutFlowUc } from './oauth-provider.logout-flow.uc';

describe(OauthProviderLogoutFlowUc.name, () => {
	let module: TestingModule;
	let uc: OauthProviderLogoutFlowUc;

	let oauthProviderService: DeepMocked<OauthProviderService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OauthProviderLogoutFlowUc,
				{
					provide: OauthProviderService,
					useValue: createMock<OauthProviderService>(),
				},
			],
		}).compile();

		uc = module.get(OauthProviderLogoutFlowUc);
		oauthProviderService = module.get(OauthProviderService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('logoutFlow', () => {
		describe('when logging out a user', () => {
			const setup = () => {
				const challenge = 'challenge_mock';
				const redirectResponse: ProviderRedirectResponse = { redirect_to: 'mockredirect' };

				oauthProviderService.acceptLogoutRequest.mockResolvedValueOnce(redirectResponse);

				return {
					challenge,
					redirectResponse,
				};
			};

			it('should call the external provider', async () => {
				const { challenge } = setup();

				await uc.logoutFlow(challenge);

				expect(oauthProviderService.acceptLogoutRequest).toHaveBeenCalledWith(challenge);
			});

			it('should return a logout response', async () => {
				const { challenge, redirectResponse } = setup();

				const result: ProviderRedirectResponse = await uc.logoutFlow(challenge);

				expect(result).toEqual(redirectResponse);
			});
		});
	});
});
