import { Injectable } from '@nestjs/common';
import { OauthProviderService } from '@shared/infra/oauth-provider/index';
import { OauthClient } from '@shared/infra/oauth-provider/dto/index';

@Injectable()
export class OauthProviderUc {
	constructor(private readonly oauthProviderService: OauthProviderService) {}

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
		const promise: Promise<OauthClient> = this.oauthProviderService.createOAuth2Client(data);
		return promise;
	}

	updateOAuth2Client(id: string, data: OauthClient): Promise<OauthClient> {
		const promise: Promise<OauthClient> = this.oauthProviderService.updateOAuth2Client(id, data);
		return promise;
	}

	deleteOAuth2Client(id: string): Promise<void> {
		const promise: Promise<void> = this.oauthProviderService.deleteOAuth2Client(id);
		return promise;
	}
}
