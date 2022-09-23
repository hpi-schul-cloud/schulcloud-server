import { Injectable } from '@nestjs/common';
import { OauthProviderService } from '@shared/infra/oauth-provider/index';
import { OauthClient } from '@shared/infra/oauth-provider/dto/index';
import { ICurrentUser, Permission, User } from '@shared/domain/index';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';

@Injectable()
export class OauthProviderClientCrudUc {
	constructor(
		private readonly oauthProviderService: OauthProviderService,
		private readonly authorizationService: AuthorizationService
	) {}

	private readonly defaultOauthClientBody: OauthClient = {
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
	): Promise<OauthClient[]> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.OAUTH_CLIENT_VIEW]);

		const client: OauthClient[] = await this.oauthProviderService.listOAuth2Clients(limit, offset, client_name, owner);
		return client;
	}

	async getOAuth2Client(currentUser: ICurrentUser, id: string): Promise<OauthClient> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.OAUTH_CLIENT_VIEW]);

		const client: OauthClient = await this.oauthProviderService.getOAuth2Client(id);
		return client;
	}

	async createOAuth2Client(currentUser: ICurrentUser, data: OauthClient): Promise<OauthClient> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.OAUTH_CLIENT_EDIT]);

		const dataWithDefaults: OauthClient = { ...this.defaultOauthClientBody, ...data };
		const client: OauthClient = await this.oauthProviderService.createOAuth2Client(dataWithDefaults);
		return client;
	}

	async updateOAuth2Client(currentUser: ICurrentUser, id: string, data: OauthClient): Promise<OauthClient> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.OAUTH_CLIENT_EDIT]);

		const dataWithDefaults: OauthClient = { ...this.defaultOauthClientBody, ...data };
		const client: OauthClient = await this.oauthProviderService.updateOAuth2Client(id, dataWithDefaults);
		return client;
	}

	async deleteOAuth2Client(currentUser: ICurrentUser, id: string): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.OAUTH_CLIENT_EDIT]);

		return this.oauthProviderService.deleteOAuth2Client(id);
	}
}
