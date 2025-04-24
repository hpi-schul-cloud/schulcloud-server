import { ProviderOauthClient } from '@modules/oauth-provider/domain';
import { Injectable } from '@nestjs/common';
import { Oauth2ToolConfig } from '../domain';

@Injectable()
export class ExternalToolServiceMapper {
	public mapDoToProviderOauthClient(name: string, oauth2Config: Oauth2ToolConfig): Partial<ProviderOauthClient> {
		return {
			client_name: name,
			client_id: oauth2Config.clientId,
			client_secret: oauth2Config.clientSecret,
			scope: oauth2Config.scope,
			token_endpoint_auth_method: oauth2Config.tokenEndpointAuthMethod,
			redirect_uris: oauth2Config.redirectUris,
			frontchannel_logout_uri: oauth2Config.frontchannelLogoutUri,
			subject_type: 'pairwise',
			grant_types: ['authorization_code', 'refresh_token'],
			response_types: ['code', 'token', 'id_token'],
		};
	}
}
