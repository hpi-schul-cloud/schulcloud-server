import { type ContextExternalToolConfigurationStatus } from '../../common/domain';
import { type LtiDeepLink } from './lti-deep-link';

export class ToolReference {
	public contextToolId: string;

	public description?: string;

	public logoUrl?: string;

	public thumbnailUrl?: string;

	public displayName: string;

	public domain: string;

	public openInNewTab: boolean;

	public status: ContextExternalToolConfigurationStatus;

	public isLtiDeepLinkingTool: boolean;

	public ltiDeepLink?: LtiDeepLink;

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
