import { ContextExternalToolDO, ExternalToolDO, ToolConfigurationStatus, ToolReference } from '@shared/domain';

export class ToolReferenceMapper {
	static mapToToolReference(
		externalTool: ExternalToolDO,
		contextExternalTool: ContextExternalToolDO,
		status: ToolConfigurationStatus
	): ToolReference {
		const toolReference = new ToolReference({
			contextToolId: contextExternalTool.id as string,
			logoUrl: externalTool.logoUrl,
			displayName: contextExternalTool.displayName ?? externalTool.name,
			status,
			openInNewTab: externalTool.openNewTab,
		});

		return toolReference;
	}
}
