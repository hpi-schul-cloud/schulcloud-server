import { AcceptLoginRequestBody, ProviderLoginResponse } from '@shared/infra/oauth-provider/dto';
import { LoginRequestBody } from '@src/modules/oauth-provider/controller/dto';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiToolRepo, PseudonymsRepo, RoleRepo, UserRepo } from '@shared/repo';
import { OauthProviderRequestMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-request.mapper';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { IResolvedUser, PermissionService, PseudonymDO, User } from '@shared/domain';
import { ResolvedUserMapper } from '@src/modules/user/mapper';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';

@Injectable()
export class OauthProviderLoginFlowService {
	constructor(
		private readonly ltiToolRepo: LtiToolRepo,
		private readonly pseudonymsRepo: PseudonymsRepo,
		private readonly userRepo: UserRepo,
		private readonly roleRepo: RoleRepo,
		private readonly permissionService: PermissionService
	) {}

	async setSubject(
		currentUserId: string,
		loginResponse: ProviderLoginResponse,
		loginRequestBody: LoginRequestBody
	): Promise<AcceptLoginRequestBody> {
		if (loginResponse.client.client_id) {
			const ltiToolDO: LtiToolDO = await this.ltiToolRepo.findByOauthClientIdAndIsLocal(loginResponse.client.client_id);
			const pseudonym: PseudonymDO = await this.pseudonymsRepo.findByUserIdAndToolId(
				ltiToolDO.id as string,
				currentUserId
			);
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

	async validateNextcloudPermission(currentUserId: string, loginResponse: ProviderLoginResponse) {
		// TODO after consent flow merge change User to UserDO
		// userService getById -> return Dto
		const user: User = await this.userRepo.findById(currentUserId);
		const permissions: string[] = this.permissionService.resolvePermissions(user);
		const resolvedUser: IResolvedUser = ResolvedUserMapper.mapToResponse(user, permissions, user.roles.getItems());

		if (loginResponse.client.client_id) {
			const ltiToolDO: LtiToolDO = await this.ltiToolRepo.findByOauthClientIdAndIsLocal(loginResponse.client.client_id);
			// use permission enum for nextcloud user
			if (ltiToolDO.name === 'SchulcloudNextcloud' && !resolvedUser.permissions.includes('NEXTCLOUD_USER')) {
				throw new ForbiddenException('You are not allowed to use Nextcloud');
			}
		}
	}
}
