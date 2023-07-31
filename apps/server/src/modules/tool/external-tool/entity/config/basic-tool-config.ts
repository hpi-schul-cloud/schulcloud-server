import { Embeddable } from '@mikro-orm/core';
import { ToolConfigType } from '../../../common/enum';
import { ExternalToolConfigEntity } from './external-tool-config';

@Embeddable({ discriminatorValue: ToolConfigType.BASIC })
export class BasicToolConfig extends ExternalToolConfigEntity {
	constructor(props: BasicToolConfig) {
		super(props);
		this.type = ToolConfigType.BASIC;
		this.baseUrl = props.baseUrl;
	}
}
