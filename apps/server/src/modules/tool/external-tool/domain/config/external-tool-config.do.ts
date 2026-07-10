import { type ToolConfigType } from '../../../common/enum';

export abstract class ExternalToolConfig {
	public type: ToolConfigType;

	public baseUrl: string;

	constructor(props: ExternalToolConfig) {
		this.type = props.type;
		this.baseUrl = props.baseUrl;
	}
}
