import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolService } from '@modules/tool/external-tool/service';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';

@Injectable()
export class OauthProviderLoginFlowService {
	constructor(private readonly externalToolService: ExternalToolService) {}

	public async findToolByClientId(clientId: string): Promise<ExternalTool> {
		const externalTool: ExternalTool | null = await this.externalToolService.findExternalToolByOAuth2ConfigClientId(
			clientId
		);

		if (externalTool) {
			return externalTool;
		}

		throw new NotFoundException(`Unable to find ExternalTool for clientId: ${clientId}`);
	}

	// TODO N21-91. Magic Strings are not desireable
	public isNextcloudTool(tool: ExternalTool): boolean {
		const isNextcloud: boolean = tool.name === 'SchulcloudNextcloud';

		return isNextcloud;
	}
}
