import { ContextExternalToolConfigurationStatus } from '../../common/domain';
import { ExternalTool } from '../../external-tool/domain';
import { ContextExternalTool, ToolReference } from '../domain';

export class ToolReferenceMapper {
	public static mapToToolReference(
		externalTool: ExternalTool,
		contextExternalTool: ContextExternalTool,
		status: ContextExternalToolConfigurationStatus
	): ToolReference {
		const toolReference = new ToolReference({
			contextToolId: contextExternalTool.id ?? '',
			description: externalTool.description,
			logoUrl: externalTool.logoUrl,
			thumbnailUrl: externalTool.thumbnail?.getPreviewUrl(),
			displayName: contextExternalTool.displayName ?? externalTool.name,
			domain: new URL(externalTool.config.baseUrl).hostname,
			status,
			openInNewTab: externalTool.openNewTab,
			isLtiDeepLinkingTool: externalTool.isLtiDeepLinkingTool(),
			ltiDeepLink: contextExternalTool.ltiDeepLink,
		});

		return toolReference;
	}
}
