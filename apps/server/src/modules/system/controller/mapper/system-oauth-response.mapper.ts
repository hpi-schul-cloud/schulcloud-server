import { OauthConfigResponse } from '@src/modules/system/controller/dto/oauth-config.response';
import { SystemOauthResponse } from '@src/modules/system/controller/dto/system-oauth.response';
import { SystemResponse } from '@src/modules/system/controller/dto/system.response';
import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';

export class SystemOauthResponseMapper {
	static mapFromDtoToResponse(systems: SystemDto[]): SystemOauthResponse {
		const systemResponses: SystemResponse[] = [];
		systems.forEach((system) =>
			systemResponses.push(
				new SystemResponse({
					id: system.id || '',
					type: system.type,
					url: system.url,
					alias: system.alias,
					displayName: system.displayName,
					oauthConfig: system.oauthConfig
						? SystemOauthResponseMapper.mapFromOauthConfigDtoToResponse(system.oauthConfig)
						: undefined,
				})
			)
		);
		return new SystemOauthResponse(systemResponses);
	}

	static mapFromOauthConfigDtoToResponse(oauthConfigDto: OauthConfigDto): OauthConfigResponse {
		return new OauthConfigResponse({
			clientId: oauthConfigDto.clientId,
			// clientSecret will not be mapped for security reasons,
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
