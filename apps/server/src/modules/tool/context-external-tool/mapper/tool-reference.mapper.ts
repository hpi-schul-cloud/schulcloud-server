import { ContextExternalToolConfigurationStatus } from '../../common/domain';
import { ExternalTool } from '../../external-tool/domain';
import { ContextExternalTool, ToolReference } from '../domain';

export class ToolReferenceMapper {
	static mapToToolReference(
		externalTool: ExternalTool,
		contextExternalTool: ContextExternalTool,
		status: ContextExternalToolConfigurationStatus
	): ToolReference {
		const toolReference = new ToolReference({
			contextToolId: contextExternalTool.id ?? '',
			description: externalTool.description,
			logoUrl: externalTool.logoUrl,
			displayName: contextExternalTool.displayName ?? externalTool.name,
			status,
			openInNewTab: externalTool.openNewTab,
		});

		return toolReference;
	}
}
