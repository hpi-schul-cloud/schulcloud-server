import { ProviderLoginResponse } from '@shared/infra/oauth-provider/dto';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiToolRepo, PseudonymsRepo } from '@shared/repo';
import { InternalServerErrorException } from '@nestjs/common';
import { Permission, PseudonymDO, User } from '@shared/domain';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { AuthorizationService } from '@src/modules/authorization';

@Injectable()
export class OauthProviderLoginFlowService {
	constructor(
		private readonly ltiToolRepo: LtiToolRepo,
		private readonly pseudonymsRepo: PseudonymsRepo,
		private readonly authorizationService: AuthorizationService
	) {}

	async getPseudonym(currentUserId: string, loginResponse: ProviderLoginResponse): Promise<PseudonymDO> {
		if (!loginResponse.client.client_id) {
			throw new InternalServerErrorException('Could not find oAuthClientId in login response to get the pseudonym');
		}

		const ltiToolDO: LtiToolDO = await this.ltiToolRepo.findByClientIdAndIsLocal(loginResponse.client.client_id, true);
		const pseudonym: PseudonymDO = await this.pseudonymsRepo.findByUserIdAndToolId(
			ltiToolDO.id as string,
			currentUserId
		);
		return pseudonym;
	}

	// TODO N21-91. Magic Strings are not desireable
	private async isNextcloudTool(loginResponse: ProviderLoginResponse): Promise<boolean> {
		if (!loginResponse.client?.client_id) {
			throw new InternalServerErrorException('Could not find oAuthClientId in login response to get the LtiTool');
		}

		const ltiToolDO: LtiToolDO = await this.ltiToolRepo.findByClientIdAndIsLocal(loginResponse.client.client_id, true);
		const isNextcloud: boolean = ltiToolDO.name === 'SchulcloudNextcloud';
		return isNextcloud;
	}

	async validateNextcloudPermission(currentUserId: string, loginResponse: ProviderLoginResponse): Promise<void> {
		const isNextcloudTool: boolean = await this.isNextcloudTool(loginResponse);
		if (isNextcloudTool) {
			const user: User = await this.authorizationService.getUserWithPermissions(currentUserId);
			this.authorizationService.checkAllPermissions(user, [Permission.NEXTCLOUD_USER]);
		}
	}
}
