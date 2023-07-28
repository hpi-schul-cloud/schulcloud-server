import { ExternalToolDO, ToolReference } from '../domain';
import { ContextExternalToolDO } from '../../context-external-tool/domain';
import { ToolConfigurationStatus } from '../../common/enum';

export class ToolReferenceMapper {
	static mapToToolReference(
		externalTool: ExternalToolDO,
		contextExternalTool: ContextExternalToolDO,
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
