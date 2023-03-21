import { OauthConfigResponse } from '@src/modules/system/controller/dto/oauth-config.response';
import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { PublicSystemListResponse } from '../dto/public-system-list.response';
import { PublicSystemResponse } from '../dto/public-system-response';

export class SystemResponseMapper {
	static mapFromDtoToResponse(systems: SystemDto[]): PublicSystemListResponse {
		const systemResponses: PublicSystemResponse[] = [];
		systems.forEach((system) =>
			systemResponses.push(
				new PublicSystemResponse({
					id: system.id || '',
					type: system.type,
					url: system.url,
					alias: system.alias,
					displayName: system.displayName,
					oauthConfig: system.oauthConfig
						? SystemResponseMapper.mapFromOauthConfigDtoToResponse(system.oauthConfig)
						: undefined,
				})
			)
		);
		return new PublicSystemListResponse(systemResponses);
	}

	static mapFromOauthConfigDtoToResponse(oauthConfigDto: OauthConfigDto): OauthConfigResponse {
		return new OauthConfigResponse({
			clientId: oauthConfigDto.clientId,
			// clientSecret will not be mapped for security reasons,
			idpHint: oauthConfigDto.idpHint,
			redirectUri: oauthConfigDto.redirectUri,
			grantType: oauthConfigDto.grantType,
			tokenEndpoint: oauthConfigDto.tokenEndpoint,
			authEndpoint: oauthConfigDto.authEndpoint,
			responseType: oauthConfigDto.responseType,
			scope: oauthConfigDto.scope,
			provider: oauthConfigDto.provider,
			logoutEndpoint: oauthConfigDto.logoutEndpoint,
			issuer: oauthConfigDto.issuer,
			jwksEndpoint: oauthConfigDto.jwksEndpoint,
		});
	}
}
