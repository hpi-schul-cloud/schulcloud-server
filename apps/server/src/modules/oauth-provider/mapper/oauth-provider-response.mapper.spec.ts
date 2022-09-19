import { OauthProviderResponseMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-response.mapper';

describe('OauthProviderResponseMapper', () => {
	let mapper: OauthProviderResponseMapper;

	beforeAll(() => {
		mapper = new OauthProviderResponseMapper();
	});

	// TODO remove after implementation
	it('should be defined', () => {
		expect(mapper).toBeDefined();
	});
});
