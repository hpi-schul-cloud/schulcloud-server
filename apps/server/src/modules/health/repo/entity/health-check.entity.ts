import { Entity, PrimaryKeyProp, PrimaryKey, Property, Index } from '@mikro-orm/core';

export interface HealthCheckEntityProps {
	id: string;
	updatedAt: Date;
}

@Entity({ tableName: 'healthchecks' })
export class HealthCheckEntity {
	[PrimaryKeyProp]?: string;

	@PrimaryKey({ name: '_id' })
	id!: string;

	@Property()
	@Index({ options: { expireAfterSeconds: 60 * 60 } })
	updatedAt!: Date;

	constructor(props: HealthCheckEntityProps) {
		this.id = props.id;
		this.updatedAt = props.updatedAt;
	}
}
