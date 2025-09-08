import { ContextExternalToolConfigurationStatus } from '../../common/domain';
import { LtiDeepLink } from './lti-deep-link';

export class ToolReference {
	contextToolId: string;

	description?: string;

	logoUrl?: string;

	thumbnailUrl?: string;

	displayName: string;

	domain: string;

	openInNewTab: boolean;

	status: ContextExternalToolConfigurationStatus;

	isLtiDeepLinkingTool: boolean;

	ltiDeepLink?: LtiDeepLink;

	constructor(toolReference: ToolReference) {
		this.contextToolId = toolReference.contextToolId;
		this.description = toolReference.description;
		this.logoUrl = toolReference.logoUrl;
		this.thumbnailUrl = toolReference.thumbnailUrl;
		this.displayName = toolReference.displayName;
		this.domain = toolReference.domain;
		this.openInNewTab = toolReference.openInNewTab;
		this.status = toolReference.status;
		this.isLtiDeepLinkingTool = toolReference.isLtiDeepLinkingTool;
		this.ltiDeepLink = toolReference.ltiDeepLink;
	}
}
