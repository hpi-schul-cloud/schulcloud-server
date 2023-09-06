import { Embeddable, ManyToOne, Property } from '@mikro-orm/core';
import { System } from './system.entity';

export interface ExternalSourceEntityProps {
	externalId: string;

	system: System;
}

@Embeddable()
export class ExternalSourceEntity {
	@Property()
	externalId: string;

	@ManyToOne(() => System)
	system: System;

	constructor(props: ExternalSourceEntityProps) {
		this.externalId = props.externalId;
		this.system = props.system;
	}
}
