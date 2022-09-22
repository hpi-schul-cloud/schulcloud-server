import { Injectable } from '@nestjs/common';
import { OauthProviderService } from '@shared/infra/oauth-provider/index';
import { OauthClient } from '@shared/infra/oauth-provider/dto/index';
import { ICurrentUser, Permission, User } from '@shared/domain/index';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { UserRepo } from '@shared/repo/index';

@Injectable()
export class OauthProviderClientCrudUc {
	constructor(
		private readonly oauthProviderService: OauthProviderService,
		private readonly authorizationService: AuthorizationService,
		private readonly userRepo: UserRepo
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
		const user: User = await this.userRepo.findById(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.OAUTH_CLIENT_VIEW]);

		const promise: Promise<OauthClient[]> = this.oauthProviderService.listOAuth2Clients(
			limit,
			offset,
			client_name,
			owner
		);
		return promise;
	}

	async getOAuth2Client(currentUser: ICurrentUser, id: string): Promise<OauthClient> {
		const user: User = await this.userRepo.findById(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.OAUTH_CLIENT_VIEW]);

		const promise: Promise<OauthClient> = this.oauthProviderService.getOAuth2Client(id);
		return promise;
	}

	async createOAuth2Client(currentUser: ICurrentUser, data: OauthClient): Promise<OauthClient> {
		const user: User = await this.userRepo.findById(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.OAUTH_CLIENT_EDIT]);

		const dataWithDefaults: OauthClient = { ...this.defaultOauthClientBody, ...data };
		const promise: Promise<OauthClient> = this.oauthProviderService.createOAuth2Client(dataWithDefaults);
		return promise;
	}

	async updateOAuth2Client(currentUser: ICurrentUser, id: string, data: OauthClient): Promise<OauthClient> {
		const user: User = await this.userRepo.findById(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.OAUTH_CLIENT_EDIT]);

		const dataWithDefaults: OauthClient = { ...this.defaultOauthClientBody, ...data };
		const promise: Promise<OauthClient> = this.oauthProviderService.updateOAuth2Client(id, dataWithDefaults);
		return promise;
	}

	async deleteOAuth2Client(currentUser: ICurrentUser, id: string): Promise<void> {
		const user: User = await this.userRepo.findById(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.OAUTH_CLIENT_EDIT]);

		const promise: Promise<void> = this.oauthProviderService.deleteOAuth2Client(id);
		return promise;
	}
}
