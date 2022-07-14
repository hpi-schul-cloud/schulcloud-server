import { OauthConfig } from '@shared/domain';
import { TokenRequestPayload } from '../controller/dto/token-request.payload';

export class TokenRequestMapper {
	static createTokenRequestPayload(
		oauthConfig: OauthConfig,
		decryptedClientSecret: string,
		code: string
	): TokenRequestPayload {
		return this.mapCreateTokenRequestPayload(oauthConfig, decryptedClientSecret, code);
	}

	static mapCreateTokenRequestPayload(
		oauthConfig: OauthConfig,
		decryptedClientSecret: string,
		code: string
	): TokenRequestPayload {
		return {
			tokenEndpoint: oauthConfig.tokenEndpoint,
			client_id: oauthConfig.clientId,
			client_secret: decryptedClientSecret,
			redirect_uri: oauthConfig.redirectUri,
			grant_type: oauthConfig.grantType,
			code,
		};
	}
}
