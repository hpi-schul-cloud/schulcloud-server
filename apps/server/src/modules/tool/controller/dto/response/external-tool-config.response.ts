import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';

export class ExternalToolConfigResponse {
	type: ToolConfigType;

	baseUrl: string;

	constructor(props: ExternalToolConfigResponse) {
		this.type = ToolConfigType.BASIC;
		this.baseUrl = props.baseUrl;
	}
}
