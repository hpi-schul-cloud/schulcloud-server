import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiToolService } from '@src/modules/lti-tool/service';
import { ExternalTool } from '@src/modules/tool/external-tool/domain';
import { ExternalToolService } from '@src/modules/tool/external-tool/service';

@Injectable()
export class OauthProviderLoginFlowService {
	constructor(
		private readonly ltiToolService: LtiToolService,
		private readonly externalToolService: ExternalToolService
	) {}

	public async findToolByClientId(clientId: string): Promise<ExternalTool | LtiToolDO> {
		const externalTool: ExternalTool | null = await this.externalToolService.findExternalToolByOAuth2ConfigClientId(
			clientId
		);
		const ltiTool: LtiToolDO | null = await this.ltiToolService.findByClientIdAndIsLocal(clientId, true);

		if (externalTool) {
			return externalTool;
		}

		if (ltiTool) {
			return ltiTool;
		}

		throw new NotFoundException(`Unable to find ExternalTool or LtiTool for clientId: ${clientId}`);
	}

	// TODO N21-91. Magic Strings are not desireable
	public isNextcloudTool(tool: ExternalTool | LtiToolDO): boolean {
		const isNextcloud: boolean = tool.name === 'SchulcloudNextcloud';

		return isNextcloud;
	}
}
