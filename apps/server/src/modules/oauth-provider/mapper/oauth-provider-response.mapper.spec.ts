import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import { OauthClient } from '@shared/infra/oauth-provider/dto/index';
import { OauthClientResponse } from '@src/modules/oauth-provider/controller/dto/index';

describe('OauthProviderResponseMapper', () => {
	let mapper: OauthProviderResponseMapper;

	beforeAll(() => {
		mapper = new OauthProviderResponseMapper();
	});

	describe('mapOauthClientToClientResponse', () => {
		it('should map oauth client to client response', () => {
			const client: OauthClient = {
				client_id: 'clientId',
				client_name: 'clientName',
				redirect_uris: ['redirectUri'],
				token_endpoint_auth_method: 'authMethod',
				subject_type: 'subjectType',
				scope: 'scope',
				frontchannel_logout_uri: 'logoutUri',
			};

			const response: OauthClientResponse = mapper.mapOauthClientToClientResponse(client);

			expect(response).toEqual(expect.objectContaining(client));
		});
	});
});
