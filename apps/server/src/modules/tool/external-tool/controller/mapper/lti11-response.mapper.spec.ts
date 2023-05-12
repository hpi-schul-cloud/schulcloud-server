import { Authorization } from 'oauth-1.0a';
import { Lti11ResponseMapper } from './lti11-response.mapper';
import { Lti11LaunchResponse } from '../dto/response';

describe('Lti11ResponseMapper', () => {
	let mapper: Lti11ResponseMapper;

	beforeAll(() => {
		mapper = new Lti11ResponseMapper();
	});

	describe('mapAuthorizationToResponse', () => {
		it('should map oauth1 parameters to launch response', () => {
			const authorization: Authorization = {
				oauth_consumer_key: 'key',
				oauth_nonce: 'nonce',
				oauth_body_hash: 'body_hash',
				oauth_signature: 'signature',
				oauth_timestamp: 100,
				oauth_token: 'token',
				oauth_version: 'version',
				oauth_signature_method: 'signature_method',
			};
			const expectedResponse: Lti11LaunchResponse = new Lti11LaunchResponse(authorization);

			const result: Lti11LaunchResponse = mapper.mapAuthorizationToResponse(authorization);

			expect(result).toEqual(expectedResponse);
		});
	});
});
