import { ContextExternalToolConfigurationStatus } from '../../common/domain';
import { LtiDeepLink } from './lti-deep-link';

export class ToolReference {
	contextToolId: string;

	description?: string;

	logoUrl?: string;

	displayName: string;

	openInNewTab: boolean;

	status: ContextExternalToolConfigurationStatus;

	ltiDeepLink?: LtiDeepLink;

	constructor(toolReference: ToolReference) {
		this.contextToolId = toolReference.contextToolId;
		this.description = toolReference.description;
		this.logoUrl = toolReference.logoUrl;
		this.displayName = toolReference.displayName;
		this.openInNewTab = toolReference.openInNewTab;
		this.status = toolReference.status;
		this.ltiDeepLink = toolReference.ltiDeepLink;
	}
}
