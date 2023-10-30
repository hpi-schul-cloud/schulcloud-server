import { Embeddable, Enum, Property } from '@mikro-orm/core';
import { ToolConfigType } from '@src/modules/tool/common/enum/tool-config-type.enum';

@Embeddable({ abstract: true, discriminatorColumn: 'type' })
export abstract class ExternalToolConfigEntity {
	@Enum()
	type: ToolConfigType;

	@Property()
	baseUrl: string;

	constructor(props: ExternalToolConfigEntity) {
		this.type = props.type;
		this.baseUrl = props.baseUrl;
	}
}
