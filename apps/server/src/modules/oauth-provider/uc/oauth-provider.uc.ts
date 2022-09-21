import { Injectable } from '@nestjs/common';
import { OauthProviderService } from '@shared/infra/oauth-provider/index';
import { OauthClient } from '@shared/infra/oauth-provider/dto/index';

@Injectable()
export class OauthProviderUc {
	constructor(private readonly oauthProviderService: OauthProviderService) {}

	private readonly defaultOauthClientBody: OauthClient = {
		scope: 'openid offline',
		grant_types: ['authorization_code', 'refresh_token'],
		response_types: ['code', 'token', 'id_token'],
		redirect_uris: [],
	};

	listOAuth2Clients(limit?: number, offset?: number, client_name?: string, owner?: string): Promise<OauthClient[]> {
		const promise: Promise<OauthClient[]> = this.oauthProviderService.listOAuth2Clients(
			limit,
			offset,
			client_name,
			owner
		);
		return promise;
	}

	getOAuth2Client(id: string): Promise<OauthClient> {
		const promise: Promise<OauthClient> = this.oauthProviderService.getOAuth2Client(id);
		return promise;
	}

	createOAuth2Client(data: OauthClient): Promise<OauthClient> {
		const dataWithDefaults: OauthClient = { ...this.defaultOauthClientBody, ...data };
		const promise: Promise<OauthClient> = this.oauthProviderService.createOAuth2Client(dataWithDefaults);
		return promise;
	}

	updateOAuth2Client(id: string, data: OauthClient): Promise<OauthClient> {
		const dataWithDefaults: OauthClient = { ...this.defaultOauthClientBody, ...data };
		const promise: Promise<OauthClient> = this.oauthProviderService.updateOAuth2Client(id, dataWithDefaults);
		return promise;
	}

	deleteOAuth2Client(id: string): Promise<void> {
		const promise: Promise<void> = this.oauthProviderService.deleteOAuth2Client(id);
		return promise;
	}
}
