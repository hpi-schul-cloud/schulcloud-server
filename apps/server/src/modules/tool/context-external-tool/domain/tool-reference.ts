import { ContextExternalToolConfigurationStatus } from '../../common/domain';

export class ToolReference {
	contextToolId: string;

	logoUrl?: string;

	displayName: string;

	openInNewTab: boolean;

	status: ContextExternalToolConfigurationStatus;

	constructor(toolReference: ToolReference) {
		this.contextToolId = toolReference.contextToolId;
		this.logoUrl = toolReference.logoUrl;
		this.displayName = toolReference.displayName;
		this.openInNewTab = toolReference.openInNewTab;
		this.status = toolReference.status;
	}
}
