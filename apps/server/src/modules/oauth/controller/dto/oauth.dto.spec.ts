import { validate } from 'class-validator';
import { TokenRequestPayload } from './token-request.payload';
import { OauthTokenResponse } from './oauth-token.response';

const tokenRequestPayload = new TokenRequestPayload();
tokenRequestPayload.client_id = '12345';
tokenRequestPayload.client_secret = 'asdf';
tokenRequestPayload.code = '1111';
tokenRequestPayload.grant_type = 'code';
tokenRequestPayload.redirect_uri = 'www.mock.de';
tokenRequestPayload.tokenEndpoint = 'www.tokenendpointmock,de';

describe('token-request-payload', () => {
	it('should validate', async () => {
		const validationErrors = await validate(tokenRequestPayload);
		expect(validationErrors).toHaveLength(0);
	});
});

describe('oauth-token-response', () => {
	const oauthTokenResponse = new OauthTokenResponse();
	oauthTokenResponse.access_token = '12345';
	oauthTokenResponse.id_token = 'asdf';
	oauthTokenResponse.refresh_token = '1111';

	it('should validate', async () => {
		const validationErrors = await validate(oauthTokenResponse);
		expect(validationErrors).toHaveLength(0);
	});
});
