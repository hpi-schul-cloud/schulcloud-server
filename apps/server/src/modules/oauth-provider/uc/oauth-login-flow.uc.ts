import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OauthProviderService } from '@shared/infra/oauth-provider/index';
import {
	AcceptLoginRequestBody,
	LoginResponse,
	RedirectResponse,
	RejectRequestBody,
} from '@shared/infra/oauth-provider/dto';
import { AcceptQuery, LoginRequestBody } from '@src/modules/oauth-provider/controller/dto';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiToolRepo, PseudonymsRepo, RoleRepo, UserRepo } from '@shared/repo';
import { OauthProviderRequestMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-request.mapper';
import { IResolvedUser, PermissionService, User } from '@shared/domain';
import { ResolvedUserMapper } from '@src/modules/user/mapper';

@Injectable()
export class OauthProviderLoginFlowUc {
	constructor(
		private readonly oauthProviderService: OauthProviderService,
		private readonly ltiToolRepo: LtiToolRepo,
		private readonly pseudonymsRepo: PseudonymsRepo,
		private readonly userRepo: UserRepo,
		private readonly roleRepo: RoleRepo,
		private readonly permissionService: PermissionService
	) {}

	getLoginRequest(challenge: string): Promise<LoginResponse> {
		const loginResponse: Promise<LoginResponse> = this.oauthProviderService.getLoginRequest(challenge);
		return loginResponse;
	}

	async patchLoginRequest(
		currentUserId: string,
		challenge: string,
		body: LoginRequestBody | RejectRequestBody,
		query: AcceptQuery
	): Promise<RedirectResponse> {
		const loginResponse: LoginResponse = await this.oauthProviderService.getLoginRequest(challenge);
		const redirectResponse: RedirectResponse = query.accept
			? await this.acceptLoginRequest(currentUserId, loginResponse, body as LoginRequestBody)
			: await this.rejectLoginRequest(challenge, body as RejectRequestBody);
		return redirectResponse;
	}

	async acceptLoginRequest(
		currentUserId: string,
		loginResponse: LoginResponse,
		loginRequestBody: LoginRequestBody
	): Promise<RedirectResponse> {
		const acceptLoginRequestBody: AcceptLoginRequestBody = await this.setSubject(
			currentUserId,
			loginResponse,
			loginRequestBody
		);
		await this.validateNextcloudPermission(currentUserId, loginResponse);

		const redirectResponse: RedirectResponse = await this.oauthProviderService.acceptLoginRequest(
			loginResponse.challenge,
			acceptLoginRequestBody
		);
		return redirectResponse;
	}

	async setSubject(
		currentUserId: string,
		loginResponse: LoginResponse,
		loginRequestBody: LoginRequestBody
	): Promise<AcceptLoginRequestBody> {
		if (loginResponse.client.client_id) {
			const ltiToolDO: LtiToolDO = await this.ltiToolRepo.findByOauthClientIdAndIsLocal(loginResponse.client.client_id);
			const pseudonym = await this.pseudonymsRepo.findByUserIdAndToolId(ltiToolDO.id!, currentUserId);
			const acceptLoginRequestBody: AcceptLoginRequestBody = OauthProviderRequestMapper.mapCreateAcceptLoginRequestBody(
				loginResponse,
				loginRequestBody,
				currentUserId,
				pseudonym.pseudonym
			);
			return acceptLoginRequestBody;
		}
		throw new NotFoundException('Could not find oAuthClientId in login response to set subject');
	}

	async validateNextcloudPermission(currentUserId: string, loginResponse: LoginResponse) {
		// TODO after consent flow merge change User to UserDO
		const user: User = await this.userRepo.findById(currentUserId);
		const permissions: string[] = this.permissionService.resolvePermissions(user);
		const resolvedUser: IResolvedUser = ResolvedUserMapper.mapToResponse(user, permissions, user.roles.getItems());

		if (loginResponse.client.client_id) {
			const ltiToolDO: LtiToolDO = await this.ltiToolRepo.findByOauthClientIdAndIsLocal(loginResponse.client.client_id);
			if (ltiToolDO.name === 'SchulcloudNextcloud' && !resolvedUser.permissions.includes('NEXTCLOUD_USER')) {
				throw new ForbiddenException('You are not allowed to use Nextcloud');
			}
		}
	}

	async rejectLoginRequest(challenge: string, rejectRequestBody: RejectRequestBody): Promise<RedirectResponse> {
		const redirectResponse: Promise<RedirectResponse> = this.oauthProviderService.rejectLoginRequest(
			challenge,
			rejectRequestBody
		);
		return redirectResponse;
	}
}
