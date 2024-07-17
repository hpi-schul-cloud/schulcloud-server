import { Embeddable, ManyToOne, Property } from '@mikro-orm/core';
import { SystemEntity } from '@modules/system/entity/system.entity';

export interface ExternalSourceEntityProps {
	externalId: string;

	system: SystemEntity;

	lastSyncedAt: Date;
}

@Embeddable()
export class ExternalSourceEmbeddable {
	@Property()
	externalId: string;

	@ManyToOne(() => SystemEntity)
	system: SystemEntity;

	@Property()
	lastSyncedAt: Date;

	constructor(props: ExternalSourceEntityProps) {
		this.externalId = props.externalId;
		this.system = props.system;
		this.lastSyncedAt = props.lastSyncedAt;
	}
}
