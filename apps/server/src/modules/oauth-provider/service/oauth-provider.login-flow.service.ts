import { ProviderLoginResponse } from '@shared/infra/oauth-provider/dto';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiToolRepo, PseudonymsRepo, RoleRepo, UserRepo } from '@shared/repo';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Permission, PseudonymDO, User } from '@shared/domain';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { AuthorizationService } from '@src/modules';

@Injectable()
export class OauthProviderLoginFlowService {
	constructor(
		private readonly ltiToolRepo: LtiToolRepo,
		private readonly pseudonymsRepo: PseudonymsRepo,
		private readonly userRepo: UserRepo,
		private readonly roleRepo: RoleRepo,
		private readonly authorizationService: AuthorizationService
	) {}

	async getPseudonym(currentUserId: string, loginResponse: ProviderLoginResponse): Promise<PseudonymDO> {
		if (!loginResponse.client.client_id) {
			throw new NotFoundException('Could not find oAuthClientId in login response to get the pseudonym');
		}

		const ltiToolDO: LtiToolDO = await this.ltiToolRepo.findByClientIdAndIsLocal(loginResponse.client.client_id, true);
		const pseudonym: PseudonymDO = await this.pseudonymsRepo.findByUserIdAndToolId(
			ltiToolDO.id as string,
			currentUserId
		);
		return pseudonym;
	}

	private async hasNextcloudPermission(currentUserId: string) {
		const user: User = await this.userRepo.findById(currentUserId, true);
		const hasPermission: boolean = this.authorizationService.hasAllPermissions(user, [
			Permission.NEXTCLOUD_USER as string,
		]);

		return hasPermission;
	}

	private async isNextcloudTool(loginResponse: ProviderLoginResponse) {
		if (loginResponse.client.client_id) {
			const ltiToolDO: LtiToolDO = await this.ltiToolRepo.findByClientIdAndIsLocal(
				loginResponse.client.client_id,
				true
			);
			if (ltiToolDO.name === 'SchulcloudNextcloud') {
				return true;
			}
		}
		return false;
	}

	async validateNextcloudPermission(currentUserId: string, loginResponse: ProviderLoginResponse) {
		const isNextcloudTool: boolean = await this.isNextcloudTool(loginResponse);
		const hasPermission: boolean = await this.hasNextcloudPermission(currentUserId);
		if (isNextcloudTool && !hasPermission) {
			throw new ForbiddenException('You are not allowed to use Nextcloud');
		}
	}
}
