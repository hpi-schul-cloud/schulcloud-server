import { ToolConfigType } from '@src/modules/tool/common/enum/tool-config-type.enum';
import { ExternalToolConfig } from './external-tool-config.do';

export class BasicToolConfig extends ExternalToolConfig {
	constructor(props: BasicToolConfig) {
		super({
			type: ToolConfigType.BASIC,
			baseUrl: props.baseUrl,
		});
	}
}
