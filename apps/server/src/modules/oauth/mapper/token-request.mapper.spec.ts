import { OauthConfig } from '@shared/domain';
import { systemFactory } from '@shared/testing';
import { TokenRequestPayload } from '../controller/dto';
import { TokenRequestMapper } from './token-request.mapper';

const defaultdecryptedClientSecret = 'mocksecret';
const defaultAuthCode = '43534543jnj543342jn2';
const defaultOauthConfig: OauthConfig = systemFactory.withOauthConfig().build().oauthConfig as OauthConfig;
const expectedPayload: TokenRequestPayload = new TokenRequestPayload({
	code: defaultAuthCode,
	client_id: '12345',
	client_secret: defaultdecryptedClientSecret,
	grant_type: 'authorization_code',
	redirect_uri: 'http://mockhost:3030/api/v3/sso/oauth/',
	tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
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
