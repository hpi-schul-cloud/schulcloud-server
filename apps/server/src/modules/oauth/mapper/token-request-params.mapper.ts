import { System } from '@shared/domain';
import { TokenRequestParams } from '../controller/dto/token-request.params';

export class TokenRequestParamsMapper {
	static mapToResponse(system: System, decryptedClientSecret: string, code: string): TokenRequestParams {
		const dto = this.mapCreateTokenRequestParams(system, decryptedClientSecret, code);
		return dto;
	}

	static mapCreateTokenRequestParams(system: System, decryptedClientSecret: string, code: string): TokenRequestParams {
		const dto = {
			client_id: system.oauthConfig.clientId,
			client_secret: decryptedClientSecret,
			redirect_uri: system.oauthConfig.tokenRedirectUri,
			grant_type: system.oauthConfig.grantType,
			code,
		};
		return dto;
	}
}
