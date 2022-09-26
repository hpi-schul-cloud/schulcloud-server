import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import { ProviderLoginResponse, ProviderRedirectResponse } from '@shared/infra/oauth-provider/dto';
import { RedirectResponse } from 'apps/server/src/modules/oauth-provider/controller/dto/response/redirect.response';
import { LoginResponse } from '@src/modules/oauth-provider/controller/dto/response/login.response';

class OauthProviderResponseMapperSpec extends OauthProviderResponseMapper {
	mapLoginResponseSpec(providerLoginResponse: ProviderLoginResponse): LoginResponse {
		return super.mapLoginResponse(providerLoginResponse);
	}
}

describe('OauthProviderResponseMapper', () => {
	let mapper: OauthProviderResponseMapperSpec;

	beforeAll(() => {
		mapper = new OauthProviderResponseMapperSpec();
	});

	it('mapRedirectResponse', () => {
		const providerResponse: ProviderRedirectResponse = { redirect_to: 'anywhere' };

		const result: RedirectResponse = mapper.mapRedirectResponse(providerResponse);

		expect(result.redirect_to).toEqual(providerResponse.redirect_to);
	});

	it('mapRedirectResponse', () => {
		const providerResponse: ProviderRedirectResponse = { redirect_to: 'anywhere' };

		const result: RedirectResponse = mapper.mapRedirectResponse(providerResponse);

		expect(result.redirect_to).toEqual(providerResponse.redirect_to);
	});

	it('mapOauthClientResponseSpec', () => {
		const providerLoginResponse: ProviderLoginResponse = {
			challenge: 'challenge',

			client: {},

			oidc_context: {},

			request_url: 'request_url',

			requested_access_token_audience: ['requested_access_token_audience'],

			requested_scope: ['requested_scope'],

			session_id: 'session_id',
		} as ProviderLoginResponse;

		const result: LoginResponse = mapper.mapLoginResponseSpec(providerLoginResponse);

		expect(result).toEqual(expect.objectContaining(providerLoginResponse));
	});
});
