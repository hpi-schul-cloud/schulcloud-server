import { Entity, Property, Unique } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';

export interface PseudonymEntityProps {
	id?: EntityId;
	pseudonym: string;
	toolId: ObjectId;
	userId: ObjectId;
}

@Entity({ tableName: 'pseudonyms' })
@Unique({ properties: ['userId', 'toolId'] })
export class PseudonymEntity extends BaseEntityWithTimestamps {
	@Property()
	@Unique()
	pseudonym: string;

	@Property()
	toolId: ObjectId;

	@Property()
	userId: ObjectId;

	constructor(props: PseudonymEntityProps) {
		super();
		if (props.id != null) {
			this.id = props.id;
		}
		this.pseudonym = props.pseudonym;
		this.toolId = props.toolId;
		this.userId = props.userId;
	}
}
