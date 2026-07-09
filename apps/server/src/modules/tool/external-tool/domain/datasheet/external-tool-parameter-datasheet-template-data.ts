import { type CustomParameterLocation } from '../../../common/enum';

export class ExternalToolParameterDatasheetTemplateData {
	public name: string;

	public properties: string;

	public scope: string;

	public type: string;

	public location: CustomParameterLocation;

	constructor(parameterData: ExternalToolParameterDatasheetTemplateData) {
		this.name = parameterData.name;
		this.properties = parameterData.properties;
		this.scope = parameterData.scope;
		this.type = parameterData.type;
		this.location = parameterData.location;
	}
}
