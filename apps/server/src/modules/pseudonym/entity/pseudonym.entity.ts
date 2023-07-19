import { Entity, Property, Unique } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';

export type IPseudonymEntityProps = Readonly<Omit<PseudonymEntity, keyof BaseEntityWithTimestamps>>;

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

	constructor(props: IPseudonymEntityProps) {
		super();
		this.pseudonym = props.pseudonym;
		this.toolId = props.toolId;
		this.userId = props.userId;
	}
}
