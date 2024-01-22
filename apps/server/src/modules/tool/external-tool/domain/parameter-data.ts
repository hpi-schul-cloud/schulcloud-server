import { ExternalToolParameterProperty } from '../../common/enum';

export class ParameterData {
	name: string;

	properties: ExternalToolParameterProperty[];

	scope?: string;

	type?: string;

	constructor(parameterData: ParameterData) {
		this.name = parameterData.name;
		this.properties = parameterData.properties;
		this.scope = parameterData.scope;
		this.type = parameterData.type;
	}
}
