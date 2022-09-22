import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import { ProviderRedirectResponse } from '@shared/infra/oauth-provider/dto';
import { RedirectResponse } from 'apps/server/src/modules/oauth-provider/controller/dto/response/redirect.response';

describe('OauthProviderResponseMapper', () => {
	let mapper: OauthProviderResponseMapper;

	beforeAll(() => {
		mapper = new OauthProviderResponseMapper();
	});

	it('mapRedirectResponse', () => {
		// Arrange
		const providerResponse: ProviderRedirectResponse = { redirect_to: 'anywhere' };

		// Act
		const result: RedirectResponse = mapper.mapRedirectResponse(providerResponse);

		// Assert
		expect(result.redirect_to).toEqual(providerResponse.redirect_to);
	});
});
