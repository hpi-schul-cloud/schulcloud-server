export class ExternalToolParameterDatasheetTemplateData {
	name: string;

	properties: string;

	scope?: string;

	type?: string;

	constructor(parameterData: ExternalToolParameterDatasheetTemplateData) {
		this.name = parameterData.name;
		this.properties = parameterData.properties;
		this.scope = parameterData.scope;
		this.type = parameterData.type;
	}
}
