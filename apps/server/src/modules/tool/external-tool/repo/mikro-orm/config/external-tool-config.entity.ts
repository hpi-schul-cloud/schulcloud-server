import { Embeddable, Enum, Property } from '@mikro-orm/core';
import { ToolConfigType } from '../../../../common/enum';

@Embeddable({ abstract: true, discriminatorColumn: 'type' })
export abstract class ExternalToolConfigEntity {
	// have to reset items to undefined to avoid MikroORM validation errors
	@Enum({ items: undefined })
	type: ToolConfigType;

	@Property()
	baseUrl: string;

	constructor(props: ExternalToolConfigEntity) {
		this.type = props.type;
		this.baseUrl = props.baseUrl;
	}
}
