import { OauthConfigResponse } from '@src/modules/system/controller/dto/oauth-config.response';
import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { PublicSystemListResponse } from '../dto/public-system-list.response';
import { PublicSystemResponse } from '../dto/public-system-response';

export class SystemResponseMapper {
	static mapFromDtoToListResponse(systems: SystemDto[]): PublicSystemListResponse {
		const systemResponses: PublicSystemResponse[] = systems.map(
			(system: SystemDto): PublicSystemResponse => this.mapFromDtoToResponse(system)
		);

		const systemListResponse: PublicSystemListResponse = new PublicSystemListResponse(systemResponses);

		return systemListResponse;
	}

	static mapFromDtoToResponse(system: SystemDto): PublicSystemResponse {
		const systemResponse: PublicSystemResponse = new PublicSystemResponse({
			id: system.id || '',
			type: system.type,
			alias: system.alias,
			displayName: system.displayName,
			oauthConfig: system.oauthConfig
				? SystemResponseMapper.mapFromOauthConfigDtoToResponse(system.oauthConfig)
				: undefined,
		});

		return systemResponse;
	}

	static mapFromOauthConfigDtoToResponse(oauthConfigDto: OauthConfigDto): OauthConfigResponse {
		const oauthConfigResponse: OauthConfigResponse = new OauthConfigResponse({
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

		return oauthConfigResponse;
	}
}
