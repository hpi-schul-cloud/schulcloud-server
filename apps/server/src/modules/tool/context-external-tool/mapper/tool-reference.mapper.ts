import { ToolConfigurationStatus } from '../../common/enum';
import { ExternalTool } from '../../external-tool/domain';
import { ContextExternalTool, ToolReference } from '../domain';

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
