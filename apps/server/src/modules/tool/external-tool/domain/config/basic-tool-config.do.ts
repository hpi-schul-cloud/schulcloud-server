import { ToolConfigType } from '../../../common/enum';
import { ExternalToolConfigDO } from './external-tool-config.do';

export class BasicToolConfigDO extends ExternalToolConfigDO {
	constructor(props: BasicToolConfigDO) {
		super({
			type: ToolConfigType.BASIC,
			baseUrl: props.baseUrl,
		});
	}
}
