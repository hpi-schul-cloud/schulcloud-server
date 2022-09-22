import { Test, TestingModule } from '@nestjs/testing';
import { OauthProviderService } from '@shared/infra/oauth-provider/index';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AcceptQuery, ConsentRequestBody } from '@src/modules/oauth-provider/controller/dto';
import {
	AcceptConsentRequestBody,
	ProviderConsentResponse,
	ProviderRedirectResponse,
	RejectRequestBody,
} from '@shared/infra/oauth-provider/dto';
import { OauthProviderConsentFlowUc } from '@src/modules/oauth-provider/uc/oauth-provider.consent-flow.uc';
import { ICurrentUser } from '@shared/domain';
import { ForbiddenException } from '@nestjs/common';
import { IdTokenService } from '@src/modules/oauth-provider/service/id-token.service';
import { IdToken } from '@src/modules/oauth-provider/interface/id-token';
import resetAllMocks = jest.resetAllMocks;
import clearAllMocks = jest.clearAllMocks;

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

		afterEach(() => {
			resetAllMocks();
		});

		describe('getConsentRequest', () => {
			it('should call service', async () => {
				// Act
				await uc.getConsentRequest(challenge);

				// Assert
				expect(service.getConsentRequest).toHaveBeenCalledWith(challenge);
			});
		});

		describe('patchConsentRequest', () => {
			let requestBody: ConsentRequestBody | RejectRequestBody;
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

			afterEach(() => {
				clearAllMocks();
			});

			it('acceptConsentRequest: validateSubject should fail and throws forbidden', async () => {
				// Arrange
				consentResponse.subject = 'notValidSubject';

				// Act
				await expect(uc.patchConsentRequest(challenge, acceptQuery, requestBody, currentUser)).rejects.toThrow(
					ForbiddenException
				);

				// Assert
				expect(service.getConsentRequest).toHaveBeenCalledWith(challenge);
				expect(service.acceptConsentRequest).not.toHaveBeenCalledWith();
				expect(service.rejectConsentRequest).not.toHaveBeenCalled();
			});

			it('acceptConsentRequest: should call service', async () => {
				// Arrange
				const expectedResult: ProviderRedirectResponse = { redirect_to: 'http://blub' };
				service.acceptConsentRequest.mockResolvedValue(expectedResult);

				// Act
				const providerRedirectResponse: ProviderRedirectResponse = await uc.patchConsentRequest(
					challenge,
					acceptQuery,
					requestBody,
					currentUser
				);

				// Assert
				expect(providerRedirectResponse.redirect_to).toEqual(expectedResult.redirect_to);
				expect(service.getConsentRequest).toHaveBeenCalledWith(challenge);
				expect(service.acceptConsentRequest).toHaveBeenCalledWith(challenge, requestBody);
				expect(service.rejectConsentRequest).not.toHaveBeenCalled();
			});

			it('acceptConsentRequest: should generate idtoken and set this as json to session', async () => {
				// Arrange
				const jsonStringifySpy = jest.spyOn(JSON, 'stringify');
				const idToken: IdToken = { userId: currentUser.userId, schoolId: 'schoolId' };
				idTokenService.createIdToken.mockResolvedValue(idToken);
				consentResponse = { ...consentResponse, client: { client_id: 'clientId' } };
				service.getConsentRequest.mockResolvedValue(consentResponse);

				// Act
				await uc.patchConsentRequest(challenge, acceptQuery, requestBody, currentUser);

				// Assert
				expect(idTokenService.createIdToken).toHaveBeenCalledWith(
					currentUser.userId,
					consentResponse.requested_scope,
					consentResponse.client?.client_id
				);
				expect(jsonStringifySpy).toHaveBeenCalledWith(idToken);
				expect(service.acceptConsentRequest).toHaveBeenCalledWith(
					challenge,
					expect.objectContaining<AcceptConsentRequestBody>({ session: { id_token: JSON.stringify(idToken) } })
				);
			});

			it('rejectConsentRequest: reject because accept in query is false', async () => {
				// Arrange
				acceptQuery = { accept: false };

				// Act
				await uc.patchConsentRequest(challenge, acceptQuery, requestBody, currentUser);

				// Assert
				expect(service.rejectConsentRequest).toHaveBeenCalledWith(challenge, requestBody);
				expect(service.acceptConsentRequest).not.toHaveBeenCalled();
			});

			it('rejectConsentRequest: reject because it is an reject request body', async () => {
				// Arrange
				requestBody = {
					status_code: '500',
				};

				// Act
				await uc.patchConsentRequest(challenge, acceptQuery, requestBody, currentUser);

				// Assert
				expect(service.rejectConsentRequest).toHaveBeenCalledWith(challenge, requestBody);
				expect(service.acceptConsentRequest).not.toHaveBeenCalled();
			});
		});
	});
});
