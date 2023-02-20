import { OauthConfig } from '@shared/domain';
import { systemFactory } from '@shared/testing';
import { TokenRequestPayload } from '../controller/dto';
import { TokenRequestMapper } from './token-request.mapper';

const defaultdecryptedClientSecret = 'mocksecret';
const defaultAuthCode = '43534543jnj543342jn2';
const defaultOauthConfig: OauthConfig = systemFactory.withOauthConfig().build().oauthConfig as OauthConfig;
const expectedPayload: TokenRequestPayload = new TokenRequestPayload({
	code: defaultAuthCode,
	client_id: 'mock-client-id',
	client_secret: defaultdecryptedClientSecret,
	grant_type: 'mock-grant-type',
	redirect_uri: 'http://mock-app.tld/redirect',
	tokenEndpoint: 'http://mock.tld/token',
});

describe('token-request.Mapper', () => {
	describe('createTokenRequestPayload', () => {
		it('should map the Payload to dto', () => {
			const result = TokenRequestMapper.createTokenRequestPayload(
				defaultOauthConfig,
				defaultdecryptedClientSecret,
				defaultAuthCode
			);
			expect(result).toEqual(expectedPayload);
		});
	});
});
