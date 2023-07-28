import { ExternalToolDO, ToolReference } from '../domain';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ToolConfigurationStatus } from '../../common/enum';

export class ToolReferenceMapper {
	static mapToToolReference(
		externalToolDO: ExternalToolDO,
		contextExternalTool: ContextExternalTool,
		status: ToolConfigurationStatus
	): ToolReference {
		const toolReference = new ToolReference({
			contextToolId: contextExternalTool.id ?? '',
			logoUrl: externalToolDO.logoUrl,
			displayName: contextExternalTool.displayName ?? externalToolDO.name,
			status,
			openInNewTab: externalToolDO.openNewTab,
		});

		return toolReference;
	}
}
