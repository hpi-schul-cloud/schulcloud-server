import { LtiToolService } from '@modules/lti-tool/service';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolService } from '@modules/tool/external-tool/service';
import { IToolFeatures, ToolFeatures } from '@modules/tool/tool-config';
import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';

@Injectable()
export class OauthProviderLoginFlowService {
	constructor(
		private readonly ltiToolService: LtiToolService,
		@Inject(forwardRef(() => ExternalToolService)) private readonly externalToolService: ExternalToolService,
		@Inject(ToolFeatures) private readonly toolFeatures: IToolFeatures
	) {}

	public async findToolByClientId(clientId: string): Promise<ExternalTool | LtiToolDO> {
		if (this.toolFeatures.ctlToolsTabEnabled) {
			const externalTool: ExternalTool | null = await this.externalToolService.findExternalToolByOAuth2ConfigClientId(
				clientId
			);

			if (externalTool) {
				return externalTool;
			}
		}

		const ltiTool: LtiToolDO | null = await this.ltiToolService.findByClientIdAndIsLocal(clientId, true);

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
