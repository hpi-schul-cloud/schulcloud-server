import { validate } from 'class-validator';
import { TokenRequestParams } from './token-request-params';
import { TokenRequestPayload } from './token-request-payload';
import { OauthTokenResponse } from './oauth-token-response';

const tokenRequestParam = new TokenRequestParams();
tokenRequestParam.client_id = '12345';
tokenRequestParam.client_secret = 'asdf';
tokenRequestParam.code = '1111';
tokenRequestParam.grant_type = 'code';
tokenRequestParam.redirect_uri = 'www.mock.de';

describe('token-request-params', () => {
	it('should validate', async () => {
		const validationErrors = await validate(tokenRequestParam);
		expect(validationErrors).toHaveLength(0);
	});
});

describe('token-request-payload', () => {
	const tokenRequestPayload = new TokenRequestPayload();
	tokenRequestPayload.token_endpoint = 'asdfgh';
	tokenRequestPayload.tokenRequestParams = tokenRequestParam;

	it('should validate', async () => {
		const validationErrors = await validate(tokenRequestParam);
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
