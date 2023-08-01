import { ExternalToolConfigDO } from './external-tool-config.do';
import { ToolConfigType } from './tool-config-type.enum';

export class BasicToolConfigDO extends ExternalToolConfigDO {
	constructor(props: BasicToolConfigDO) {
		super({
			type: ToolConfigType.BASIC,
			baseUrl: props.baseUrl,
		});
	}
}
