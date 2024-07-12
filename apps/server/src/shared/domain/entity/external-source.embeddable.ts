import { Embeddable, ManyToOne, Property } from '@mikro-orm/core';
import { SystemEntity } from '@modules/system/entity/system.entity';

export interface ExternalSourceEntityProps {
	externalId: string;

	system: SystemEntity;
}

@Embeddable()
export class ExternalSourceEmbeddable {
	@Property()
	externalId: string;

	@ManyToOne(() => SystemEntity)
	system: SystemEntity;

	constructor(props: ExternalSourceEntityProps) {
		this.externalId = props.externalId;
		this.system = props.system;
	}
}
