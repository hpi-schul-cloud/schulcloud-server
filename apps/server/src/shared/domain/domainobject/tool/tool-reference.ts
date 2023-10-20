import { ToolConfigurationStatus } from './tool-configuration-status';

export class ToolReference {
	contextToolId: string;

	logoUrl?: string;

	displayName: string;

	openInNewTab: boolean;

	status: ToolConfigurationStatus;

	constructor(toolReference: ToolReference) {
		this.contextToolId = toolReference.contextToolId;
		this.logoUrl = toolReference.logoUrl;
		this.displayName = toolReference.displayName;
		this.openInNewTab = toolReference.openInNewTab;
		this.status = toolReference.status;
	}
}
