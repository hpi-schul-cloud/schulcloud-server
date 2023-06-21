import { Entity, PrimaryKeyType, PrimaryKey, Property } from '@mikro-orm/core';

import { EntityId } from '@shared/domain';

export interface HealthcheckProps {
	id: EntityId;
	updatedAt: Date;
}

@Entity({ tableName: 'healthchecks' })
export class Healthcheck {
	[PrimaryKeyType]?: string;

	@PrimaryKey({ name: '_id' })
	id!: EntityId;

	@Property()
	updatedAt!: Date;

	constructor(props: HealthcheckProps) {
		this.id = props.id;
		this.updatedAt = props.updatedAt;
	}
}
