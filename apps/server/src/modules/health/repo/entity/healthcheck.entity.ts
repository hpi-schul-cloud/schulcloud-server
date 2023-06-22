import { Entity, PrimaryKeyType, PrimaryKey, Property } from '@mikro-orm/core';

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
	updatedAt!: Date;

	constructor(props: HealthcheckEntityProps) {
		this.id = props.id;
		this.updatedAt = props.updatedAt;
	}
}
