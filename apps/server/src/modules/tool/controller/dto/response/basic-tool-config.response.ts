import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';
import { ExternalToolConfigResponse } from '@src/modules/tool/controller/dto/response/external-tool-config.response';

export class BasicToolConfigResponse extends ExternalToolConfigResponse {
	constructor(props: BasicToolConfigResponse) {
		super(props);
		this.type = ToolConfigType.BASIC;
		this.baseUrl = props.baseUrl;
	}
}
