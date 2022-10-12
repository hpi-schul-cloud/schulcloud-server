import { Test, TestingModule } from '@nestjs/testing';
import { OauthProviderUc } from '@src/modules/oauth-provider/uc/oauth-provider.uc';
import { OauthProviderService } from '@shared/infra/oauth-provider/index';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ProviderConsentSessionResponse } from '@shared/infra/oauth-provider/dto';

describe('OauthProviderUc', () => {
	let module: TestingModule;
	let uc: OauthProviderUc;

	let providerService: DeepMocked<OauthProviderService>;

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
		providerService = module.get(OauthProviderService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('Consent Flow', () => {
		describe('listConsentSessions', () => {
			it('should list all consent sessions', async () => {
				const data: ProviderConsentSessionResponse[] = [{ consent_request: { challenge: 'challenge' } }];

				providerService.listConsentSessions.mockResolvedValue(data);

				const result: ProviderConsentSessionResponse[] = await uc.listConsentSessions('userId');

				expect(result).toEqual(data);
				expect(providerService.listConsentSessions).toHaveBeenCalledWith('userId');
			});
		});

		describe('revokeConsentSession', () => {
			it('should revoke all consent sessions', async () => {
				await uc.revokeConsentSession('userId', 'clientId');

				expect(providerService.revokeConsentSession).toHaveBeenCalledWith('userId', 'clientId');
			});
		});
	});
});
