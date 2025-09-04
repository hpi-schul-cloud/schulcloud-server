import { Embeddable, ManyToOne, Property, ref, Ref } from '@mikro-orm/core';
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
	public system: Ref<SystemEntity>;

	@Property()
	public lastSyncedAt: Date;

	constructor(props: ExternalSourceEntityProps) {
		this.externalId = props.externalId;
		this.system = ref(props.system);
		this.lastSyncedAt = props.lastSyncedAt;
	}
}
