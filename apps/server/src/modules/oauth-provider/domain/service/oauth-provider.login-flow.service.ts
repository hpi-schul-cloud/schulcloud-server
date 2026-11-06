import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolService } from '@modules/tool/external-tool/service';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';

@Injectable()
export class OauthProviderLoginFlowService {
	// Nextcloud was retired. Deployments may still hold the persisted tool and its OAuth client under this name.
	private static readonly RETIRED_NEXTCLOUD_TOOL_NAME = 'SchulcloudNextcloud';

	constructor(private readonly externalToolService: ExternalToolService) {}

	public async findToolByClientId(clientId: string): Promise<ExternalTool> {
		const externalTool: ExternalTool | null =
			await this.externalToolService.findExternalToolByOAuth2ConfigClientId(clientId);

		if (externalTool) {
			return externalTool;
		}

		throw new NotFoundException(`Unable to find ExternalTool for clientId: ${clientId}`);
	}

	public isRetiredNextcloudTool(tool: ExternalTool): boolean {
		const isRetired: boolean = tool.name === OauthProviderLoginFlowService.RETIRED_NEXTCLOUD_TOOL_NAME;

		return isRetired;
	}
}
