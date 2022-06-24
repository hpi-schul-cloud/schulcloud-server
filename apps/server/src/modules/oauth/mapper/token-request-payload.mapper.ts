import { OauthConfig } from '@shared/domain';
import { TokenRequestParams } from '../controller/dto/token-request.params';
import { TokenRequestPayload } from '../controller/dto/token-request.payload';
import { TokenRequestParamsMapper } from './token-request-params.mapper';

export class TokenRequestPayloadMapper {
	static mapToResponse(oauthConfig: OauthConfig, decryptedClientSecret: string, code: string): TokenRequestPayload {
		const params = TokenRequestParamsMapper.mapToResponse(oauthConfig, decryptedClientSecret, code);
		return this.mapCreateTokenRequestPayload(oauthConfig, params);
	}

	static mapCreateTokenRequestPayload(oauthConfig: OauthConfig, params: TokenRequestParams): TokenRequestPayload {
		return {
			tokenEndpoint: oauthConfig.tokenEndpoint,
			tokenRequestParams: params,
		};
	}
}
