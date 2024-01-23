import { LtiMessageType, LtiPrivacyPermission, ToolConfigType } from '../../common/enum';
import { ParameterData } from './parameter-data';

export class ExternalToolData {
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

	parameters: ParameterData[];

	constructor(externalToolData: ExternalToolData) {
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
