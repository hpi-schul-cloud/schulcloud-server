import { OauthConfig } from '@shared/domain';
import { TokenRequestPayload } from '../controller/dto';

export class TokenRequestMapper {
	static createTokenRequestPayload(
		oauthConfig: OauthConfig,
		decryptedClientSecret: string,
		code: string,
		migrationRedirect?: string
	): TokenRequestPayload {
		return new TokenRequestPayload({
			tokenEndpoint: oauthConfig.tokenEndpoint,
			client_id: oauthConfig.clientId,
			client_secret: decryptedClientSecret,
			redirect_uri: migrationRedirect || oauthConfig.redirectUri,
			grant_type: oauthConfig.grantType,
			code,
		});
	}
}
