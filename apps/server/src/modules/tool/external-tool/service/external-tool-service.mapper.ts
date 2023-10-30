import { Injectable } from '@nestjs/common';
import { ProviderOauthClient } from '@shared/infra/oauth-provider/dto/interface/oauth-client.interface';
import { Oauth2ToolConfig } from '../domain/config/oauth2-tool-config.do';

@Injectable()
export class ExternalToolServiceMapper {
	mapDoToProviderOauthClient(name: string, oauth2Config: Oauth2ToolConfig): ProviderOauthClient {
		return {
			client_name: name,
			client_id: oauth2Config.clientId,
			client_secret: oauth2Config.clientSecret,
			scope: oauth2Config.scope,
			token_endpoint_auth_method: oauth2Config.tokenEndpointAuthMethod,
			redirect_uris: oauth2Config.redirectUris,
			frontchannel_logout_uri: oauth2Config.frontchannelLogoutUri,
			subject_type: 'pairwise',
		};
	}
}
