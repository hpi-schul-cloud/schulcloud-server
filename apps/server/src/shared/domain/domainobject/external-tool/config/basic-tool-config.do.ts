import { ToolConfigType } from '@shared/domain';
import { ExternalToolConfigDO } from './external-tool-config.do';

export class BasicToolConfigDO extends ExternalToolConfigDO {
	constructor(props: BasicToolConfigDO) {
		super({
			type: ToolConfigType.BASIC,
			baseUrl: props.baseUrl,
		});
	}
}
