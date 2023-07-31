import { Entity, Property, Unique } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain';

export interface IExternalToolPseudonymEntityProps {
	id?: EntityId;
	pseudonym: string;
	toolId: ObjectId;
	userId: ObjectId;
}

@Entity({ tableName: 'external-tool-pseudonyms' })
@Unique({ properties: ['userId', 'toolId'] })
export class ExternalToolPseudonymEntity extends BaseEntityWithTimestamps {
	@Property()
	@Unique()
	pseudonym: string;

	@Property()
	toolId: ObjectId;

	@Property()
	userId: ObjectId;

	constructor(props: IExternalToolPseudonymEntityProps) {
		super();
		if (props.id != null) {
			this.id = props.id;
		}
		this.pseudonym = props.pseudonym;
		this.toolId = props.toolId;
		this.userId = props.userId;
	}
}
