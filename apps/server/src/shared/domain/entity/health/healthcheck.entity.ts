import { Entity, PrimaryKeyType, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'healthchecks' })
export class Healthcheck {
	[PrimaryKeyType]?: string;

	@PrimaryKey({ name: '_id' })
	id!: string;

	@Property()
	updatedAt!: Date;
}
