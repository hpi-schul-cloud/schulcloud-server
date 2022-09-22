import { Test, TestingModule } from '@nestjs/testing';
import { OauthProviderLogoutFlowUc } from '@src/modules/oauth-provider/uc/oauth-provider.logout-flow.uc';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotImplementedException } from '@nestjs/common';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import { OauthProviderController } from './oauth-provider.controller';

describe('OauthProviderController', () => {
	let module: TestingModule;
	let controller: OauthProviderController;

	let uc: DeepMocked<OauthProviderLogoutFlowUc>;
	let responseMapper: DeepMocked<OauthProviderResponseMapper>;

	const hydraUri = 'http://hydra.uri';

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockReturnValue(hydraUri);

		module = await Test.createTestingModule({
			providers: [
				OauthProviderController,
				{
					provide: OauthProviderLogoutFlowUc,
					useValue: createMock<OauthProviderLogoutFlowUc>(),
				},
				{
					provide: OauthProviderResponseMapper,
					useValue: createMock<OauthProviderResponseMapper>(),
				},
			],
		}).compile();

		controller = module.get(OauthProviderController);

		uc = module.get(OauthProviderLogoutFlowUc);
		responseMapper = module.get(OauthProviderResponseMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('Consent Flow', () => {
		describe('getConsentRequest', () => {
			it('should throw', () => {
				expect(() => controller.getConsentRequest({ challenge: '' })).toThrow(NotImplementedException);
			});
		});

		describe('patchConsentRequest', () => {
			it('should throw', () => {
				expect(() => controller.patchConsentRequest({ challenge: '' }, { accept: false }, {})).toThrow(
					NotImplementedException
				);
			});
		});

		describe('listConsentSessions', () => {
			it('should throw', () => {
				expect(() => controller.listConsentSessions({ userId: '' })).toThrow(NotImplementedException);
			});
		});

		describe('revokeConsentSession', () => {
			it('should throw', () => {
				expect(() => controller.revokeConsentSession({ userId: '' }, { client: '' })).toThrow(NotImplementedException);
			});
		});
	});

	describe('Login Flow', () => {
		describe('getLoginRequest', () => {
			it('should throw', () => {
				expect(() => controller.getLoginRequest({ challenge: '' })).toThrow(NotImplementedException);
			});
		});

		describe('patchLoginRequest', () => {
			it('should throw', () => {
				expect(() => controller.patchLoginRequest({ challenge: '' }, { accept: false }, {})).toThrow(
					NotImplementedException
				);
			});
		});
	});

	describe('Logout Flow', () => {
		describe('acceptLogoutRequest', () => {
			it('should call uc and return redirect string', async () => {
				uc.logoutFlow.mockResolvedValue({ redirect_to: 'www.mock.de' });

				const redirect = await controller.acceptLogoutRequest(
					{ challenge: 'challenge_mock' },
					{ redirect_to: 'www.mock.de' }
				);

				expect(uc.logoutFlow).toHaveBeenCalledWith('challenge_mock');
				expect(redirect).toEqual('www.mock.de');
			});
		});
	});

	describe('Client Flow', () => {
		describe('listOAuth2Clients', () => {
			it('should throw', () => {
				expect(() => controller.listOAuth2Clients({})).toThrow(NotImplementedException);
			});
		});

		describe('getOAuth2Client', () => {
			it('should throw', () => {
				expect(() => controller.getOAuth2Client({ id: '' })).toThrow(NotImplementedException);
			});
		});

		describe('createOAuth2Client', () => {
			it('should throw', () => {
				expect(() => controller.createOAuth2Client({})).toThrow(NotImplementedException);
			});
		});

		describe('updateOAuth2Client', () => {
			it('should throw', () => {
				expect(() => controller.updateOAuth2Client({ id: '' }, {})).toThrow(NotImplementedException);
			});
		});

		describe('deleteOAuth2Client', () => {
			it('should throw', () => {
				expect(() => controller.deleteOAuth2Client({ id: '' })).toThrow(NotImplementedException);
			});
		});
	});

	describe('introspectOAuth2Token', () => {
		it('should throw', () => {
			expect(() => controller.introspectOAuth2Token({ token: '' })).toThrow(NotImplementedException);
		});
	});

	describe('getUrl', () => {
		it('should return hydra uri', async () => {
			const result: string = await controller.getUrl();

			expect(result).toEqual(hydraUri);
		});
	});
});
