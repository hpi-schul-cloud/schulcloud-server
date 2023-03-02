import { Test, TestingModule } from '@nestjs/testing';
import { OauthProviderService } from '@shared/infra/oauth-provider/index';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AcceptQuery, ConsentRequestBody } from '@src/modules/oauth-provider/controller/dto';
import {
	AcceptConsentRequestBody,
	ProviderConsentResponse,
	ProviderRedirectResponse,
} from '@shared/infra/oauth-provider/dto';
import { OauthProviderConsentFlowUc } from '@src/modules/oauth-provider/uc/oauth-provider.consent-flow.uc';
import { ICurrentUser } from '@src/modules/authentication';
import { ForbiddenException } from '@nestjs/common';
import { IdTokenService } from '@src/modules/oauth-provider/service/id-token.service';
import { IdToken } from '@src/modules/oauth-provider/interface/id-token';

describe('OauthProviderConsentFlowUc', () => {
	let module: TestingModule;
	let uc: OauthProviderConsentFlowUc;
	let service: DeepMocked<OauthProviderService>;
	let idTokenService: DeepMocked<IdTokenService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OauthProviderConsentFlowUc,
				{
					provide: OauthProviderService,
					useValue: createMock<OauthProviderService>(),
				},
				{
					provide: IdTokenService,
					useValue: createMock<IdTokenService>(),
				},
			],
		}).compile();

		uc = module.get(OauthProviderConsentFlowUc);
		service = module.get(OauthProviderService);
		idTokenService = module.get(IdTokenService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('consent', () => {
		let challenge: string;
		let currentUser: ICurrentUser;
		let consentResponse: ProviderConsentResponse;

		beforeEach(() => {
			challenge = 'challengexyz';
			currentUser = { userId: 'userId' } as ICurrentUser;
			consentResponse = {
				challenge,
				subject: currentUser.userId,
			};
		});

		describe('getConsentRequest', () => {
			it('should call service', async () => {
				await uc.getConsentRequest(challenge);

				expect(service.getConsentRequest).toHaveBeenCalledWith(challenge);
			});
		});

		describe('patchConsentRequest', () => {
			let requestBody: ConsentRequestBody;
			let acceptQuery: AcceptQuery;

			beforeEach(() => {
				requestBody = {
					grant_scope: ['openid', 'offline'],
					remember: false,
					remember_for: 0,
				};
				acceptQuery = { accept: true };
				consentResponse.requested_scope = requestBody.grant_scope;
				service.getConsentRequest.mockResolvedValue(consentResponse);
			});

			describe('acceptConsentRequest', () => {
				it('validateSubject should fail and throws forbidden if the subject doesn not equals the user', async () => {
					consentResponse.subject = 'notValidSubject';

					await expect(uc.patchConsentRequest(challenge, acceptQuery, requestBody, currentUser)).rejects.toThrow(
						ForbiddenException
					);

					expect(service.getConsentRequest).toHaveBeenCalledWith(challenge);
					expect(service.acceptConsentRequest).not.toHaveBeenCalledWith();
					expect(service.rejectConsentRequest).not.toHaveBeenCalled();
				});

				it('should call service', async () => {
					const expectedResult: ProviderRedirectResponse = { redirect_to: 'http://blub' };

					service.acceptConsentRequest.mockResolvedValue(expectedResult);

					const providerRedirectResponse: ProviderRedirectResponse = await uc.patchConsentRequest(
						challenge,
						acceptQuery,
						requestBody,
						currentUser
					);

					expect(providerRedirectResponse.redirect_to).toEqual(expectedResult.redirect_to);
					expect(service.getConsentRequest).toHaveBeenCalledWith(challenge);
					expect(service.acceptConsentRequest).toHaveBeenCalledWith(challenge, requestBody);
					expect(service.rejectConsentRequest).not.toHaveBeenCalled();
				});

				it('should generate idtoken and set this as json to session', async () => {
					const idToken: IdToken = { userId: currentUser.userId, schoolId: 'schoolId' };
					consentResponse = { ...consentResponse, client: { client_id: 'clientId' }, requested_scope: ['openid'] };

					idTokenService.createIdToken.mockResolvedValue(idToken);
					service.getConsentRequest.mockResolvedValue(consentResponse);

					await uc.patchConsentRequest(challenge, acceptQuery, requestBody, currentUser);

					expect(idTokenService.createIdToken).toHaveBeenCalledWith(
						currentUser.userId,
						consentResponse.requested_scope,
						consentResponse.client?.client_id
					);
					expect(service.acceptConsentRequest).toHaveBeenCalledWith(
						challenge,
						expect.objectContaining<AcceptConsentRequestBody>({ session: { id_token: idToken } })
					);
				});

				it('should generate idtoken when requested_scope and client_id are undefined', async () => {
					const idToken: IdToken = { userId: currentUser.userId, schoolId: 'schoolId' };
					const consentResponse2: ProviderConsentResponse = {
						challenge: 'challenge',
						subject: currentUser.userId,
					};

					idTokenService.createIdToken.mockResolvedValue(idToken);
					service.getConsentRequest.mockResolvedValue(consentResponse2);

					await uc.patchConsentRequest(challenge, acceptQuery, requestBody, currentUser);

					expect(idTokenService.createIdToken).toHaveBeenCalledWith(currentUser.userId, [], '');
					expect(service.acceptConsentRequest).toHaveBeenCalledWith(
						challenge,
						expect.objectContaining<AcceptConsentRequestBody>({ session: { id_token: idToken } })
					);
				});
			});

			describe('rejectConsentRequest', () => {
				it('rejectConsentRequest: reject when accept in query is false', async () => {
					acceptQuery = { accept: false };

					await uc.patchConsentRequest(challenge, acceptQuery, requestBody, currentUser);

					expect(service.rejectConsentRequest).toHaveBeenCalledWith(challenge, requestBody);
					expect(service.acceptConsentRequest).not.toHaveBeenCalled();
				});
			});
		});
	});
});
