import { Entity, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from './base.entity';

export type IPseudonymProperties = Readonly<Omit<Pseudonym, keyof BaseEntityWithTimestamps>>;

@Entity({ tableName: 'pseudonyms' })
export class Pseudonym extends BaseEntityWithTimestamps {
	@Property()
	pseudonym: string;

	@Property()
	toolId: ObjectId;

	@Property()
	userId: ObjectId;

	constructor(props: IPseudonymProperties) {
		super();
		this.pseudonym = props.pseudonym;
		this.toolId = props.toolId;
		this.userId = props.userId;
	}
}
