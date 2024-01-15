import { AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ProviderOauthClient } from '../domain';
import { OauthProviderService } from '../domain/service/oauth-provider.service';

@Injectable()
export class OauthProviderClientCrudUc {
	constructor(
		private readonly oauthProviderService: OauthProviderService,
		private readonly authorizationService: AuthorizationService
	) {}

	private readonly defaultOauthClientBody: Readonly<Partial<ProviderOauthClient>> = {
		scope: 'openid offline',
		grant_types: ['authorization_code', 'refresh_token'],
		response_types: ['code', 'token', 'id_token'],
		redirect_uris: [],
	};

	public async listOAuth2Clients(
		userId: EntityId,
		limit?: number,
		offset?: number,
		client_name?: string,
		owner?: string
	): Promise<ProviderOauthClient[]> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.OAUTH_CLIENT_VIEW]);

		const client: ProviderOauthClient[] = await this.oauthProviderService.listOAuth2Clients(
			limit,
			offset,
			client_name,
			owner
		);

		return client;
	}

	public async getOAuth2Client(userId: EntityId, id: string): Promise<ProviderOauthClient> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.OAUTH_CLIENT_VIEW]);

		const client: ProviderOauthClient = await this.oauthProviderService.getOAuth2Client(id);

		return client;
	}

	public async createOAuth2Client(userId: EntityId, data: Partial<ProviderOauthClient>): Promise<ProviderOauthClient> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.OAUTH_CLIENT_EDIT]);

		const dataWithDefaults: Partial<ProviderOauthClient> = {
			...this.defaultOauthClientBody,
			...data,
		};

		const client: ProviderOauthClient = await this.oauthProviderService.createOAuth2Client(dataWithDefaults);

		return client;
	}

	public async updateOAuth2Client(
		userId: EntityId,
		id: string,
		data: Partial<ProviderOauthClient>
	): Promise<ProviderOauthClient> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.OAUTH_CLIENT_EDIT]);

		const dataWithDefaults: Partial<ProviderOauthClient> = {
			...this.defaultOauthClientBody,
			...data,
		};

		const client: ProviderOauthClient = await this.oauthProviderService.updateOAuth2Client(id, dataWithDefaults);

		return client;
	}

	public async deleteOAuth2Client(userId: EntityId, id: string): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.OAUTH_CLIENT_EDIT]);

		await this.oauthProviderService.deleteOAuth2Client(id);
	}
}
