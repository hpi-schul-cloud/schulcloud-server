import { ExternalToolParameterDatasheetTemplateData } from './external-tool-parameter-datasheet-template-data';

export class ExternalToolDatasheetTemplateData {
	createdAt: string;

	creatorName: string;

	instance: string;

	schoolName?: string;

	toolName: string;

	toolUrl: string;

	isDeactivated?: string;

	restrictToContexts?: string;

	toolType: string;

	skipConsent?: string;

	messageType?: string;

	privacy?: string;

	parameters?: ExternalToolParameterDatasheetTemplateData[];

	constructor(externalToolData: ExternalToolDatasheetTemplateData) {
		this.createdAt = externalToolData.createdAt;
		this.creatorName = externalToolData.creatorName;
		this.instance = externalToolData.instance;
		this.schoolName = externalToolData.schoolName;
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
