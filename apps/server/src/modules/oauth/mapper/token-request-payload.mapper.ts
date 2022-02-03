import { System } from '@shared/domain';
import { TokenRequestParams } from '../controller/dto/token-request-params';
import { TokenRequestPayload } from '../controller/dto/token-request-payload';
import { TokenRequestParamsMapper } from './token-request-params.mapper';

export class TokenRequestPayloadMapper {
	static mapToResponse(system: System, decryptedClientSecret: string, code: string): TokenRequestPayload {
		const params = TokenRequestParamsMapper.mapToResponse(system, decryptedClientSecret, code);
		const dto = this.mapCreateTokenRequestPayload(system, params);
		return dto;
	}

	static mapCreateTokenRequestPayload(system: System, params: TokenRequestParams): TokenRequestPayload {
		const dto = {
			token_endpoint: system.oauthconfig.token_endpoint,
			tokenRequestParams: params,
		};
		return dto;
	}
}
