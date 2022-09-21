import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import { ConsentSessionResponse } from '@src/modules/oauth-provider/controller/dto/response/consent-session.response';
import { ProviderConsentSessionResponse } from '@shared/infra/oauth-provider/dto/response/provider-consent-session.response';

describe('OauthProviderResponseMapper', () => {
	let mapper: OauthProviderResponseMapper;

	beforeAll(() => {
		mapper = new OauthProviderResponseMapper();
	});

	describe('mapOauthClientToClientResponse', () => {
		it('should map oauth client to client response', () => {
			const session: ProviderConsentSessionResponse = {
				consent_request: {
					challenge: 'challenge',
					client: {
						client_id: 'clientId',
						client_name: 'clientName',
					},
				},
			};

			const response: ConsentSessionResponse = mapper.mapConsentSessionsToResponse(session);

			expect(response).toEqual(
				expect.objectContaining<ConsentSessionResponse>({
					challenge: 'challenge',
					client_id: 'clientId',
					client_name: 'clientName',
				})
			);
		});
	});
});
