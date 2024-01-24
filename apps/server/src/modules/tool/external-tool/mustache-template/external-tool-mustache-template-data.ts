import { LtiMessageType, LtiPrivacyPermission, ToolConfigType } from '../../common/enum';
import { ExternalToolParameterMustacheTemplateData } from './external-tool-parameter-mustache-template-data';

export class ExternalToolMustacheTemplateData {
	createdAt: string;

	creatorName: string;

	instance: string;

	toolName: string;

	toolUrl: string;

	isDeactivated?: string;

	restrictToContexts?: string[];

	toolType: ToolConfigType;

	skipConsent?: string;

	messageType?: LtiMessageType;

	privacy?: LtiPrivacyPermission;

	parameters: ExternalToolParameterMustacheTemplateData[];

	constructor(externalToolData: ExternalToolMustacheTemplateData) {
		this.createdAt = externalToolData.createdAt;
		this.creatorName = externalToolData.creatorName;
		this.instance = externalToolData.instance;
		this.toolName = externalToolData.toolName;
		this.toolUrl = externalToolData.toolUrl;
		this.isDeactivated = externalToolData.isDeactivated;
		this.restrictToContexts = externalToolData.restrictToContexts;
		this.toolType = externalToolData.toolType;
		this.skipConsent = externalToolData.skipConsent;
		this.messageType = externalToolData.messageType;
		this.privacy = externalToolData.privacy;
		this.parameters = externalToolData.parameters;
	}
}
