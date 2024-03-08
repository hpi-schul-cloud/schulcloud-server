import { Embeddable, ManyToOne, Property } from '@mikro-orm/core';
import { SystemEntity } from './system.entity';

export interface ExternalSourceEntityProps {
	externalId: string;

	system: SystemEntity;
}

@Embeddable()
// TODO: this should not be named as entity. (remember to change filename too.)
export class ExternalSourceEntity {
	@Property()
	externalId: string;

	@ManyToOne(() => SystemEntity)
	system: SystemEntity;

	constructor(props: ExternalSourceEntityProps) {
		this.externalId = props.externalId;
		this.system = props.system;
	}
}
