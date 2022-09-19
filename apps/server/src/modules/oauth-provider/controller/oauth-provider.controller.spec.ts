import { Test, TestingModule } from '@nestjs/testing';
import { OauthProviderUc } from '@src/modules/oauth-provider/uc/oauth-provider.uc';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import { AcceptQuery, ChallengeParams, ConsentRequestBody } from '@src/modules/oauth-provider/controller/dto';
import { RedirectResponse } from '@src/modules/oauth-provider/controller/dto/response/redirect.response';
import { ConsentResponse } from '@shared/infra/oauth-provider/dto';
import { OauthProviderController } from './oauth-provider.controller';

describe('OauthProviderController', () => {
	let module: TestingModule;
	let controller: OauthProviderController;
	let mapper: DeepMocked<OauthProviderResponseMapper>;
	let uc: DeepMocked<OauthProviderUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OauthProviderController,
				{
					provide: OauthProviderUc,
					useValue: createMock<OauthProviderUc>(),
				},
				{
					provide: OauthProviderResponseMapper,
					useValue: createMock<OauthProviderResponseMapper>(),
				},
			],
		}).compile();

		controller = module.get(OauthProviderController);
		uc = module.get(OauthProviderUc);
		mapper = module.get(OauthProviderResponseMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	// TODO remove after implementation
	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('consent', () => {
		let challengeParams: ChallengeParams;

		beforeEach(() => {
			challengeParams = { challenge: 'challengexyz' };
		});

		it('getConsentRequest should call uc', async () => {
			// Arrange
			const consentResponse: ConsentResponse = { challenge: challengeParams.challenge, subject: 'subject' };
			uc.getConsentRequest.mockResolvedValue(consentResponse);

			// Act
			const result = await controller.getConsentRequest(challengeParams);

			// Assert
			expect(result).toBeDefined();
		});

		it('patchConsentRequest should call uc and mapper', async () => {
			// Arrange
			const acceptQuery: AcceptQuery = { accept: true };
			const consentRequestBody: ConsentRequestBody = {
				grant_scope: ['openid', 'offline'],
				remember: false,
				remember_for: 0,
			};
			const expectedRedirectResponse: RedirectResponse = { redirect_to: 'anywhere' };
			uc.patchConsentRequest.mockResolvedValue(expectedRedirectResponse);

			// Act
			const result = await controller.patchConsentRequest(challengeParams, acceptQuery, consentRequestBody);

			// Assert
			expect(result).toBeDefined();
			expect(uc.patchConsentRequest).toHaveBeenCalledWith(challengeParams.challenge, acceptQuery, consentRequestBody);
			expect(mapper.mapRedirectResponse).toHaveBeenCalledWith(expectedRedirectResponse);
		});
	});
});
