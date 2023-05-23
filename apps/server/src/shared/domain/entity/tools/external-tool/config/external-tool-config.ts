import { Embeddable, Enum, Property } from '@mikro-orm/core';
import { ToolConfigType } from './tool-config-type.enum';

@Embeddable({ abstract: true, discriminatorColumn: 'type' })
export abstract class ExternalToolConfig {
	@Enum()
	type: ToolConfigType;

	@Property()
	baseUrl: string;

	constructor(props: ExternalToolConfig) {
		this.type = props.type;
		this.baseUrl = props.baseUrl;
	}
}
