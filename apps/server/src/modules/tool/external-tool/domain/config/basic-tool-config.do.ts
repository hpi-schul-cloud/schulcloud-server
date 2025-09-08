import { ToolConfigType } from '../../../common/enum';
import { ExternalToolConfig } from './external-tool-config.do';

export class BasicToolConfig extends ExternalToolConfig {
	constructor(props: Omit<BasicToolConfig, 'type'>) {
		super({
			type: ToolConfigType.BASIC,
			baseUrl: props.baseUrl,
		});
	}
}
