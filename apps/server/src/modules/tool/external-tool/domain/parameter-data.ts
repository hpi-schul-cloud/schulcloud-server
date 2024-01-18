import { CustomParameterScope, CustomParameterType, ExternalToolParameterProperty } from '../../common/enum';

export class ParameterData {
	name: string;

	properties: ExternalToolParameterProperty[];

	scope?: CustomParameterScope;

	type?: CustomParameterType;

	constructor(parameterData: ParameterData) {
		this.name = parameterData.name;
		this.properties = parameterData.properties;
		this.scope = parameterData.scope;
		this.type = parameterData.type;
	}
}
