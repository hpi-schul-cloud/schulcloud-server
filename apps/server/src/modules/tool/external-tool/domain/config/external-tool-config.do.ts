import { ToolConfigType } from '../../../common/enum';

export abstract class ExternalToolConfig {
	type: ToolConfigType;

	baseUrl: string;

	constructor(props: ExternalToolConfig) {
		this.type = props.type;
		this.baseUrl = props.baseUrl;
	}
}
