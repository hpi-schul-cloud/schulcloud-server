import { Embeddable } from '@mikro-orm/core';
import { ToolConfigType } from '../../../common/enum';
import { ExternalToolConfigEntity } from './external-tool-config.entity';

@Embeddable({ discriminatorValue: ToolConfigType.BASIC })
export class BasicToolConfigEntity extends ExternalToolConfigEntity {
	constructor(props: BasicToolConfigEntity) {
		super(props);
		this.type = ToolConfigType.BASIC;
		this.baseUrl = props.baseUrl;
	}
}
