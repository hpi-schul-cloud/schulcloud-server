import { OauthResponse } from '@src/modules/system/controller/dto/oauth.response';
import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';
import { OauthConfigResponse } from '@src/modules/system/controller/dto/oauth-config.response';

export class OauthResponseMapper {
	static mapFromDtoToResponse(oauthConfigs: OauthConfigDto[]): OauthResponse {
		const oauthConfigResponses: OauthConfigResponse[] = [];
		oauthConfigs.forEach((oauthConfigDto) =>
			oauthConfigResponses.push(
				new OauthConfigResponse({
					clientId: oauthConfigDto.clientId,
					clientSecret: oauthConfigDto.clientSecret,
					tokenRedirectUri: oauthConfigDto.tokenRedirectUri,
					grantType: oauthConfigDto.grantType,
					tokenEndpoint: oauthConfigDto.tokenEndpoint,
					authEndpoint: oauthConfigDto.authEndpoint,
					responseType: oauthConfigDto.responseType,
					scope: oauthConfigDto.scope,
					provider: oauthConfigDto.provider,
					logoutEndpoint: oauthConfigDto.logoutEndpoint,
					issuer: oauthConfigDto.issuer,
					jwksEndpoint: oauthConfigDto.jwksEndpoint,
					codeRedirectUri: oauthConfigDto.codeRedirectUri,
				})
			)
		);
		return new OauthResponse(oauthConfigResponses);
	}
}
