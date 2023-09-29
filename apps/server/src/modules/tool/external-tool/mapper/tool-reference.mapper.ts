import { ExternalTool, ToolReference } from '../domain';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ToolConfigurationStatus } from '../../common/enum';

export class ToolReferenceMapper {
	static mapToToolReference(
		externalTool: ExternalTool,
		contextExternalTool: ContextExternalTool,
		status: ToolConfigurationStatus
	): ToolReference {
		const toolReference = new ToolReference({
			contextToolId: contextExternalTool.id ?? '',
			logoUrl: externalTool.logoUrl,
			displayName: contextExternalTool.displayName ?? externalTool.name,
			status,
			openInNewTab: externalTool.openNewTab,
		});

		return toolReference;
	}
}
