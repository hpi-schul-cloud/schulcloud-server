import { System } from '@shared/domain';
import { TokenRequestParams } from '../controller/dto/token-request-params';
import { TokenRequestResponse } from '../controller/dto/token-request-response';
import { TokenRequestParamsMapper } from './token-request-params.mapper';

export class TokenRequestResponseMapper {
	static mapToResponse(system: System, decryptedClientSecret: string, code: string): TokenRequestResponse {
		const params = TokenRequestParamsMapper.mapToResponse(system, decryptedClientSecret, code);
		const dto = this.mapCreateTokenRequestResponse(system, params);
		return dto;
	}

	static mapCreateTokenRequestResponse(system: System, params: TokenRequestParams): TokenRequestResponse {
		const dto = {
			tokenEndpoint: system.oauthConfig.tokenEndpoint,
			tokenRequestParams: params,
		};
		return dto;
	}
}
