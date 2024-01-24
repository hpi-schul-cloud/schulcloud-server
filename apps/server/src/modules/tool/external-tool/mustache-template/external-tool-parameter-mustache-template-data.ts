export class ExternalToolParameterMustacheTemplateData {
	name: string;

	properties: string;

	scope?: string;

	type?: string;

	constructor(parameterData: ExternalToolParameterMustacheTemplateData) {
		this.name = parameterData.name;
		this.properties = parameterData.properties;
		this.scope = parameterData.scope;
		this.type = parameterData.type;
	}
}
