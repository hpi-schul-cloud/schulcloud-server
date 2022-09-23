import { Injectable } from '@nestjs/common';
import { OauthClientResponse } from '@src/modules/oauth-provider/controller/dto/response/oauth-client.response';
import { OauthClient } from '@shared/infra/oauth-provider/dto/index';

@Injectable()
export class OauthProviderResponseMapper {
	mapOauthClientToClientResponse(client: OauthClient): OauthClientResponse {
		return new OauthClientResponse({
			client_id: client.client_id,
			client_name: client.client_name,
			redirect_uris: client.redirect_uris,
			token_endpoint_auth_method: client.token_endpoint_auth_method,
			subject_type: client.subject_type,
			scope: client.scope,
			frontchannel_logout_uri: client.frontchannel_logout_uri,
			grant_types: client.grant_types,
			response_types: client.response_types,
		});
	}
}
