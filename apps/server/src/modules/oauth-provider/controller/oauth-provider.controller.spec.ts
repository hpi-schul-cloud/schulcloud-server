import { Test, TestingModule } from '@nestjs/testing';
import { OauthProviderLogoutFlowUc } from '@src/modules/oauth-provider/uc/oauth-provider.logout-flow.uc';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotImplementedException } from '@nestjs/common';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import { AcceptQuery, ChallengeParams, ConsentRequestBody } from '@src/modules/oauth-provider/controller/dto';
import { RedirectResponse } from '@src/modules/oauth-provider/controller/dto/response/redirect.response';
import { ProviderConsentResponse } from '@shared/infra/oauth-provider/dto';
import { OauthProviderConsentFlowUc } from '@src/modules/oauth-provider/uc/oauth-provider.consent-flow.uc';
import { ICurrentUser } from '@shared/domain';
import { OauthProviderUc } from '@src/modules/oauth-provider/uc/oauth-provider.uc';
import { ConsentResponse } from '@src/modules/oauth-provider/controller/dto/response/consent.response';
import { OauthProviderController } from './oauth-provider.controller';

describe('OauthProviderController', () => {
	let module: TestingModule;
	let controller: OauthProviderController;

	let logoutUc: DeepMocked<OauthProviderLogoutFlowUc>;
	let consentUc: DeepMocked<OauthProviderConsentFlowUc>;
	let responseMapper: DeepMocked<OauthProviderResponseMapper>;

	const hydraUri = 'http://hydra.uri';

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockReturnValue(hydraUri);

		module = await Test.createTestingModule({
			providers: [
				OauthProviderController,
				{
					provide: OauthProviderUc,
					useValue: createMock<OauthProviderUc>(),
				},
				{
					provide: OauthProviderLogoutFlowUc,
					useValue: createMock<OauthProviderLogoutFlowUc>(),
				},
				{
					provide: OauthProviderConsentFlowUc,
					useValue: createMock<OauthProviderConsentFlowUc>(),
				},
				{
					provide: OauthProviderResponseMapper,
					useValue: createMock<OauthProviderResponseMapper>(),
				},
			],
		}).compile();

		controller = module.get(OauthProviderController);

		logoutUc = module.get(OauthProviderLogoutFlowUc);
		responseMapper = module.get(OauthProviderResponseMapper);
		consentUc = module.get(OauthProviderConsentFlowUc);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('Consent Flow', () => {
		let challengeParams: ChallengeParams;

		beforeEach(() => {
			challengeParams = { challenge: 'challengexyz' };
		});

		describe('getConsentRequest', () => {
			it('should call uc and mapper', async () => {
				// Arrange
				const consentResponse: ProviderConsentResponse = {
					challenge: challengeParams.challenge,
					subject: 'subject',
				};
				consentUc.getConsentRequest.mockResolvedValue(consentResponse);
				responseMapper.mapConsentResponse.mockReturnValue(new ConsentResponse({ ...consentResponse }));

				// Act
				const result: ConsentResponse = await controller.getConsentRequest(challengeParams);

				// Assert
				expect(result.challenge).toEqual(consentResponse.challenge);
				expect(result.subject).toEqual(consentResponse.subject);
				expect(consentUc.getConsentRequest).toHaveBeenCalledWith(consentResponse.challenge);
			});
		});

		describe('patchConsentRequest', () => {
			it('should call uc and mapper', async () => {
				// Arrange
				const acceptQuery: AcceptQuery = { accept: true };
				const consentRequestBody: ConsentRequestBody = {
					grant_scope: ['openid', 'offline'],
					remember: false,
					remember_for: 0,
				};
				const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
				const expectedRedirectResponse: RedirectResponse = { redirect_to: 'anywhere' };
				consentUc.patchConsentRequest.mockResolvedValue(expectedRedirectResponse);
				responseMapper.mapRedirectResponse.mockReturnValue(expectedRedirectResponse);

				// Act
				const result: RedirectResponse = await controller.patchConsentRequest(
					challengeParams,
					acceptQuery,
					consentRequestBody,
					currentUser
				);

				// Assert
				expect(result.redirect_to).toEqual(expectedRedirectResponse.redirect_to);
				expect(consentUc.patchConsentRequest).toHaveBeenCalledWith(
					challengeParams.challenge,
					acceptQuery,
					consentRequestBody,
					currentUser
				);
				expect(responseMapper.mapRedirectResponse).toHaveBeenCalledWith(expectedRedirectResponse);
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
				const expectedRedirect: RedirectResponse = new RedirectResponse({ redirect_to: 'www.mock.de' });
				logoutUc.logoutFlow.mockResolvedValue(expectedRedirect);
				responseMapper.mapRedirectResponse.mockReturnValue(expectedRedirect);

				const redirect = await controller.acceptLogoutRequest(
					{ challenge: 'challenge_mock' },
					{ redirect_to: 'www.mock.de' }
				);

				expect(logoutUc.logoutFlow).toHaveBeenCalledWith('challenge_mock');
				expect(redirect.redirect_to).toEqual(expectedRedirect.redirect_to);
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
