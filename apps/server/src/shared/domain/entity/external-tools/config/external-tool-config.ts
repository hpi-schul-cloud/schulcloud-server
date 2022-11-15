import { ToolConfigType } from '@shared/domain/entity/external-tools/config/tool-config-type.enum';
import { Embeddable, Enum, Property } from '@mikro-orm/core';

@Embeddable({ abstract: true, discriminatorColumn: 'type' })
export abstract class ExternalToolConfig {
	constructor(props: ExternalToolConfig) {
		this.type = props.type;
		this.baseUrl = props.baseUrl;
	}

	@Enum()
	type: ToolConfigType;

	@Property()
	baseUrl: string;
}
