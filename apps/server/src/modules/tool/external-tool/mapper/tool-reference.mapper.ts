import { ExternalToolDO, ToolReference } from '../domain';
import { ContextExternalToolDO } from '../../context-external-tool/domain';
import { ToolConfigurationStatus } from '../../common/enum';

export class ToolReferenceMapper {
	static mapToToolReference(
		externalToolDO: ExternalToolDO,
		contextExternalTool: ContextExternalToolDO,
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
