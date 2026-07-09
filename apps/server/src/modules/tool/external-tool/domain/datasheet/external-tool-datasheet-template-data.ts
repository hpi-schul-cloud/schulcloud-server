import { type ExternalToolParameterDatasheetTemplateData } from './external-tool-parameter-datasheet-template-data';

export class ExternalToolDatasheetTemplateData {
	public createdAt: string;

	public creatorName: string;

	public instance: string;

	public schoolName?: string;

	public toolName: string;

	public toolUrl: string;

	public isDeactivated?: string;

	public restrictToContexts?: string;

	public toolType: string;

	public skipConsent?: string;

	public messageType?: string;

	public privacy?: string;

	public parameters?: ExternalToolParameterDatasheetTemplateData[];

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
