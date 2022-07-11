import { OauthConfig } from '@shared/domain';
import { TokenRequestParams } from '../controller/dto/token-request.params';

export class TokenRequestParamsMapper {
	static mapToResponse(oauthConfig: OauthConfig, decryptedClientSecret: string, code: string): TokenRequestParams {
		return this.mapCreateTokenRequestParams(oauthConfig, decryptedClientSecret, code);
	}

	static mapCreateTokenRequestParams(
		oauthConfig: OauthConfig,
		decryptedClientSecret: string,
		code: string
	): TokenRequestParams {
		return {
			client_id: oauthConfig.clientId,
			client_secret: decryptedClientSecret,
			redirect_uri: oauthConfig.redirectUri,
			grant_type: oauthConfig.grantType,
			code,
		};
	}
}
