import { OauthConfig, System } from '../../domain';
import { OauthConfigResponse, PublicSystemListResponse, PublicSystemResponse } from '../dto';

export class SystemResponseMapper {
	static mapFromDtoToListResponse(systems: System[]): PublicSystemListResponse {
		const systemResponses: PublicSystemResponse[] = systems.map(
			(system: System): PublicSystemResponse => this.mapFromDtoToResponse(system)
		);

		const systemListResponse: PublicSystemListResponse = new PublicSystemListResponse(systemResponses);

		return systemListResponse;
	}

	static mapFromDtoToResponse(system: System): PublicSystemResponse {
		const systemResponse: PublicSystemResponse = new PublicSystemResponse({
			id: system.id,
			type: system.type,
			alias: system.alias,
			displayName: system.displayName,
			oauthConfig: system.oauthConfig
				? SystemResponseMapper.mapFromOauthConfigDtoToResponse(system.oauthConfig)
				: undefined,
		});

		return systemResponse;
	}

	static mapFromOauthConfigDtoToResponse(oauthConfig: OauthConfig): OauthConfigResponse {
		const oauthConfigResponse: OauthConfigResponse = new OauthConfigResponse({
			clientId: oauthConfig.clientId,
			// clientSecret will not be mapped for security reasons,
			idpHint: oauthConfig.idpHint,
			redirectUri: oauthConfig.redirectUri,
			grantType: oauthConfig.grantType,
			tokenEndpoint: oauthConfig.tokenEndpoint,
			authEndpoint: oauthConfig.authEndpoint,
			responseType: oauthConfig.responseType,
			scope: oauthConfig.scope,
			provider: oauthConfig.provider,
			logoutEndpoint: oauthConfig.logoutEndpoint,
			issuer: oauthConfig.issuer,
			jwksEndpoint: oauthConfig.jwksEndpoint,
		});

		return oauthConfigResponse;
	}
}
