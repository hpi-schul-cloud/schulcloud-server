import { Embeddable, ManyToOne, Property } from '@mikro-orm/core';
import { SystemEntity } from './system.entity';

export interface ExternalSourceEntityProps {
	externalId: string;

	system: SystemEntity;

	lastSyncedAt: Date;
}

@Embeddable()
export class ExternalSourceEmbeddable {
	@Property()
	public externalId: string;

	@ManyToOne(() => SystemEntity)
	public system: SystemEntity;

	@Property()
	public lastSyncedAt: Date;

	constructor(props: ExternalSourceEntityProps) {
		this.externalId = props.externalId;
		this.system = props.system;
		this.lastSyncedAt = props.lastSyncedAt;
	}
}
