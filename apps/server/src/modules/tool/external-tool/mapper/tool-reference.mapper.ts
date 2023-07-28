import { ExternalToolDO, ToolReference } from '../domainobject';
import { ContextExternalToolDO } from '../../context-external-tool/domainobject';
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
