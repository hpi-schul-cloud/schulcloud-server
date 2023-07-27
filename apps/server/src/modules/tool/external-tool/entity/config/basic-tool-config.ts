import { Embeddable } from '@mikro-orm/core';
import { ToolConfigType } from '../../../common/interface';
import { ExternalToolConfig } from './external-tool-config';

@Embeddable({ discriminatorValue: ToolConfigType.BASIC })
export class BasicToolConfig extends ExternalToolConfig {
	constructor(props: BasicToolConfig) {
		super(props);
		this.type = ToolConfigType.BASIC;
		this.baseUrl = props.baseUrl;
	}
}
