import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { ExternalToolDO, Permission, User } from '@shared/domain';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { AuthorizationService } from '@src/modules/authorization';
import { LtiToolService } from '@src/modules/lti-tool/service';
import { PseudonymService } from '@src/modules/pseudonym/service';
import { ExternalToolService } from '@src/modules/tool/service';

@Injectable()
export class OauthProviderLoginFlowService {
	constructor(
		private readonly ltiToolService: LtiToolService,
		private readonly externalToolService: ExternalToolService,
		private readonly pseudonymService: PseudonymService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async findToolByClientId(clientId: string): Promise<ExternalToolDO | LtiToolDO> {
		const externalTool: ExternalToolDO | null = await this.externalToolService.findExternalToolByOAuth2ConfigClientId(
			clientId
		);
		const ltiTool: LtiToolDO | null = await this.ltiToolService.findByClientIdAndIsLocal(clientId, true);

		if (!externalTool && !ltiTool) {
			throw new NotFoundException(`Unable to find ExternalTool or LtiTool for clientId: ${clientId}`);
		}

		return (externalTool ?? ltiTool) as ExternalToolDO | LtiToolDO;
	}

	// TODO N21-91. Magic Strings are not desireable
	public isNextcloudTool(tool: ExternalToolDO | LtiToolDO): boolean {
		const isNextcloud: boolean = tool.name === 'SchulcloudNextcloud';

		return isNextcloud;
	}

	async validateNextcloudPermission(userId: string): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.NEXTCLOUD_USER]);
	}
}
