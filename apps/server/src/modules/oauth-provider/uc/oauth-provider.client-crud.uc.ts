import { Injectable } from '@nestjs/common';
import { OauthProviderService } from '@shared/infra/oauth-provider/index';
import { Permission, User } from '@shared/domain/index';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { ProviderOauthClient } from '@shared/infra/oauth-provider/dto';
import { ICurrentUser } from '@src/modules/authentication';

@Injectable()
export class OauthProviderClientCrudUc {
	constructor(
		private readonly oauthProviderService: OauthProviderService,
		private readonly authorizationService: AuthorizationService
	) {}

	private readonly defaultOauthClientBody: ProviderOauthClient = {
		scope: 'openid offline',
		grant_types: ['authorization_code', 'refresh_token'],
		response_types: ['code', 'token', 'id_token'],
		redirect_uris: [],
	};

	async listOAuth2Clients(
		currentUser: ICurrentUser,
		limit?: number,
		offset?: number,
		client_name?: string,
		owner?: string
	): Promise<ProviderOauthClient[]> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.OAUTH_CLIENT_VIEW]);

		const client: ProviderOauthClient[] = await this.oauthProviderService.listOAuth2Clients(
			limit,
			offset,
			client_name,
			owner
		);
		return client;
	}

	async getOAuth2Client(currentUser: ICurrentUser, id: string): Promise<ProviderOauthClient> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.OAUTH_CLIENT_VIEW]);

		const client: ProviderOauthClient = await this.oauthProviderService.getOAuth2Client(id);

		return client;
	}

	async createOAuth2Client(currentUser: ICurrentUser, data: ProviderOauthClient): Promise<ProviderOauthClient> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.OAUTH_CLIENT_EDIT]);

		const dataWithDefaults: ProviderOauthClient = { ...this.defaultOauthClientBody, ...data };
		const client: ProviderOauthClient = await this.oauthProviderService.createOAuth2Client(dataWithDefaults);
		return client;
	}

	async updateOAuth2Client(
		currentUser: ICurrentUser,
		id: string,
		data: ProviderOauthClient
	): Promise<ProviderOauthClient> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.OAUTH_CLIENT_EDIT]);

		const dataWithDefaults: ProviderOauthClient = { ...this.defaultOauthClientBody, ...data };
		const client: ProviderOauthClient = await this.oauthProviderService.updateOAuth2Client(id, dataWithDefaults);
		return client;
	}

	async deleteOAuth2Client(currentUser: ICurrentUser, id: string): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.OAUTH_CLIENT_EDIT]);

		return this.oauthProviderService.deleteOAuth2Client(id);
	}
}
