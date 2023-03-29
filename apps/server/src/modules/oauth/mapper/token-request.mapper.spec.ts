import { OAuthTokenDto } from '../interface';
import { OAuthGrantType } from '../interface/oauth-grant-type.enum';
import { AuthenticationCodeGrantTokenRequest } from '../service/dto';
import { TokenRequestMapper } from './token-request.mapper';

describe('TokenRequestMapper', () => {
	describe('createAuthenticationCodeGrantTokenRequestPayload', () => {
		it('should map the Payload to dto', () => {
			const result: AuthenticationCodeGrantTokenRequest =
				TokenRequestMapper.createAuthenticationCodeGrantTokenRequestPayload(
					'clientId',
					'secret',
					'code',
					'redirectUri'
				);

			expect(result).toEqual<AuthenticationCodeGrantTokenRequest>({
				code: 'code',
				client_id: 'clientId',
				client_secret: 'secret',
				grant_type: OAuthGrantType.AUTHORIZATION_CODE_GRANT,
				redirect_uri: 'redirectUri',
			});
		});
	});

	describe('mapTokenResponseToDto', () => {
		it('should map the token response to dto', () => {
			const result: OAuthTokenDto = TokenRequestMapper.mapTokenResponseToDto({
				id_token: 'idToken',
				refresh_token: 'refreshToken',
				access_token: 'accessToken',
			});

			expect(result).toEqual<OAuthTokenDto>({
				idToken: 'idToken',
				refreshToken: 'refreshToken',
				accessToken: 'accessToken',
			});
		});
	});
});
