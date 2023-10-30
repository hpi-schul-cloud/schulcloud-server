import { ToolConfigurationStatus } from '../../common/enum/tool-configuration-status';
import { ExternalTool } from '../../external-tool/domain/external-tool.do';
import { ContextExternalTool } from '../domain/context-external-tool.do';
import { ToolReference } from '../domain/tool-reference';

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
