import { Entity, PrimaryKeyType, PrimaryKey, Property, Index } from '@mikro-orm/core';

export interface HealthcheckEntityProps {
	id: string;
	updatedAt: Date;
}

@Entity({ tableName: 'healthchecks' })
export class HealthcheckEntity {
	[PrimaryKeyType]?: string;

	@PrimaryKey({ name: '_id' })
	id!: string;

	@Property()
	@Index({ options: { expireAfterSeconds: 60 * 60 } })
	updatedAt!: Date;

	constructor(props: HealthcheckEntityProps) {
		this.id = props.id;
		this.updatedAt = props.updatedAt;
	}
}
