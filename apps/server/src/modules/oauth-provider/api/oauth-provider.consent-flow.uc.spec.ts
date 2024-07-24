import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	AcceptConsentRequestBody,
	IdToken,
	ProviderConsentResponse,
	ProviderRedirectResponse,
	RejectRequestBody,
} from '../domain';
import { IdTokenService } from '../domain/service/id-token.service';
import { OauthProviderService } from '../domain/service/oauth-provider.service';
import {
	acceptConsentRequestBodyFactory,
	idTokenFactory,
	providerConsentResponseFactory,
	rejectRequestBodyFactory,
} from '../testing';
import { OauthProviderConsentFlowUc } from './oauth-provider.consent-flow.uc';

describe(OauthProviderConsentFlowUc.name, () => {
	let module: TestingModule;
	let uc: OauthProviderConsentFlowUc;

	let oauthProviderService: DeepMocked<OauthProviderService>;
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
		oauthProviderService = module.get(OauthProviderService);
		idTokenService = module.get(IdTokenService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getConsentRequest', () => {
		describe('when fetching a consent request', () => {
			const setup = () => {
				const challenge = 'challenge';
				const consentResponse: ProviderConsentResponse = providerConsentResponseFactory.build();

				oauthProviderService.getConsentRequest.mockResolvedValueOnce(consentResponse);

				return {
					challenge,
					consentResponse,
				};
			};

			it('should call the external provider', async () => {
				const { challenge } = setup();

				await uc.getConsentRequest(challenge);

				expect(oauthProviderService.getConsentRequest).toHaveBeenCalledWith(challenge);
			});

			it('should return the consent request', async () => {
				const { challenge, consentResponse } = setup();

				const result: ProviderConsentResponse = await uc.getConsentRequest(challenge);

				expect(result).toEqual(consentResponse);
			});
		});
	});

	describe('patchConsentRequest', () => {
		describe('when accepting a consent request', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const challenge = 'challenge';
				const acceptConsentRequestBody: AcceptConsentRequestBody = acceptConsentRequestBodyFactory.build();
				const consentResponse: ProviderConsentResponse = providerConsentResponseFactory.build({ subject: userId });
				const idToken: IdToken = idTokenFactory.build();
				const redirectResponse: ProviderRedirectResponse = { redirect_to: 'mockredirect' };

				oauthProviderService.getConsentRequest.mockResolvedValueOnce(consentResponse);
				idTokenService.createIdToken.mockResolvedValueOnce(idToken);
				oauthProviderService.acceptConsentRequest.mockResolvedValueOnce(redirectResponse);

				return {
					userId,
					challenge,
					consentResponse,
					acceptConsentRequestBody,
					idToken,
					redirectResponse,
				};
			};

			it('should request a consent from the external provider', async () => {
				const { userId, challenge, acceptConsentRequestBody } = setup();

				await uc.patchConsentRequest(userId, challenge, true, acceptConsentRequestBody);

				expect(oauthProviderService.getConsentRequest).toHaveBeenCalledWith(challenge);
			});

			it('should create an id token', async () => {
				const { userId, challenge, acceptConsentRequestBody, consentResponse } = setup();

				await uc.patchConsentRequest(userId, challenge, true, acceptConsentRequestBody);

				expect(idTokenService.createIdToken).toHaveBeenCalledWith(
					userId,
					consentResponse.requested_scope,
					consentResponse.client.client_id
				);
			});

			it('should accept the consent', async () => {
				const { userId, challenge, acceptConsentRequestBody, idToken } = setup();

				await uc.patchConsentRequest(userId, challenge, true, acceptConsentRequestBody);

				expect(oauthProviderService.acceptConsentRequest).toHaveBeenCalledWith(challenge, {
					...acceptConsentRequestBody,
					session: { id_token: idToken },
				});
			});

			it('should return a redirect', async () => {
				const { userId, challenge, acceptConsentRequestBody, redirectResponse } = setup();

				const result: ProviderRedirectResponse = await uc.patchConsentRequest(
					userId,
					challenge,
					true,
					acceptConsentRequestBody
				);

				expect(result).toEqual(redirectResponse);
			});
		});

		describe('when rejecting a consent request', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const challenge = 'challenge';
				const rejectRequestBody: RejectRequestBody = rejectRequestBodyFactory.build();
				const consentResponse: ProviderConsentResponse = providerConsentResponseFactory.build({ subject: userId });
				const redirectResponse: ProviderRedirectResponse = { redirect_to: 'mockredirect' };

				oauthProviderService.getConsentRequest.mockResolvedValueOnce(consentResponse);
				oauthProviderService.rejectConsentRequest.mockResolvedValueOnce(redirectResponse);

				return {
					userId,
					challenge,
					consentResponse,
					rejectRequestBody,
					redirectResponse,
				};
			};

			it('should request a consent from the external provider', async () => {
				const { userId, challenge, rejectRequestBody } = setup();

				await uc.patchConsentRequest(userId, challenge, false, rejectRequestBody);

				expect(oauthProviderService.getConsentRequest).toHaveBeenCalledWith(challenge);
			});

			it('should reject the consent', async () => {
				const { userId, challenge, rejectRequestBody } = setup();

				await uc.patchConsentRequest(userId, challenge, false, rejectRequestBody);

				expect(oauthProviderService.rejectConsentRequest).toHaveBeenCalledWith(challenge, rejectRequestBody);
			});

			it('should return a redirect', async () => {
				const { userId, challenge, rejectRequestBody, redirectResponse } = setup();

				const result: ProviderRedirectResponse = await uc.patchConsentRequest(
					userId,
					challenge,
					false,
					rejectRequestBody
				);

				expect(result).toEqual(redirectResponse);
			});
		});

		describe('when the user is not the subject of the challenge', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const challenge = 'challenge';
				const acceptConsentRequestBody: AcceptConsentRequestBody = acceptConsentRequestBodyFactory.build();
				const consentResponse: ProviderConsentResponse = providerConsentResponseFactory.build({
					subject: 'notTheUserId',
				});

				oauthProviderService.getConsentRequest.mockResolvedValueOnce(consentResponse);

				return {
					userId,
					challenge,
					consentResponse,
					acceptConsentRequestBody,
				};
			};

			it('should throw an error', async () => {
				const { userId, challenge, acceptConsentRequestBody } = setup();

				await expect(uc.patchConsentRequest(userId, challenge, true, acceptConsentRequestBody)).rejects.toThrow(
					ForbiddenException
				);
			});
		});
	});
});
