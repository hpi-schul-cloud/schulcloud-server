import { CustomParameterLocation } from '../../../common/enum';

export class ExternalToolParameterDatasheetTemplateData {
	name: string;

	properties: string;

	scope: string;

	type: string;

	location: CustomParameterLocation;

	constructor(parameterData: ExternalToolParameterDatasheetTemplateData) {
		this.name = parameterData.name;
		this.properties = parameterData.properties;
		this.scope = parameterData.scope;
		this.type = parameterData.type;
		this.location = parameterData.location;
	}
}
