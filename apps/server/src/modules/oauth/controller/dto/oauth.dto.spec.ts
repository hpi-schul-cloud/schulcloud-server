import { validate } from 'class-validator';
import { TokenRequestParams } from './token-request.params';
import { TokenRequestPayload } from './token-request.payload';
import { OauthTokenResponse } from './oauth-token.response';

const tokenRequestParams = new TokenRequestParams();
tokenRequestParams.client_id = '12345';
tokenRequestParams.client_secret = 'asdf';
tokenRequestParams.code = '1111';
tokenRequestParams.grant_type = 'code';
tokenRequestParams.redirect_uri = 'www.mock.de';

describe('token-request-params', () => {
	it('should validate', async () => {
		const validationErrors = await validate(tokenRequestParams);
		expect(validationErrors).toHaveLength(0);
	});
});

describe('token-request-payload', () => {
	const tokenRequestPayload = new TokenRequestPayload();
	tokenRequestPayload.tokenEndpoint = 'asdfgh';
	tokenRequestPayload.tokenRequestParams = tokenRequestParams;

	it('should validate', async () => {
		const validationErrors = await validate(tokenRequestParams);
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
