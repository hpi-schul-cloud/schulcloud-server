import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';
import { ProviderRedirectResponse } from '@shared/infra/oauth-provider/dto';

describe('OauthProviderResponseMapper', () => {
	let mapper: OauthProviderResponseMapper;

	beforeAll(() => {
		mapper = new OauthProviderResponseMapper();
	});

	// TODO remove after implementation
	it('should be defined', () => {
		expect(mapper).toBeDefined();
	});

	it('mapRedirectResponse', () => {
		// Arrange
		const providerResponse: ProviderRedirectResponse = { redirect_to: 'anywhere' };

		// Act
		const result = mapper.mapRedirectResponse(providerResponse);

		// Assert
		expect(result).toBeDefined();
		expect(result.redirect_to).toEqual(providerResponse.redirect_to);
	});
});
