import { ToolConfigType } from '../../../common/enum';

export abstract class ExternalToolConfigDO {
	type: ToolConfigType;

	baseUrl: string;

	constructor(props: ExternalToolConfigDO) {
		this.type = props.type;
		this.baseUrl = props.baseUrl;
	}
}
