import { Entity, Property, Unique } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { ReferencedEntityType } from '../../types';

export interface ErwinIdentifierEntityProps {
	id?: EntityId;
	erwinId: string; // UUID from Erwin Portal
	type: ReferencedEntityType; // user or school
	referencedEntityId: EntityId; // user or school id from SVS
}

@Entity({ tableName: 'erwin-identifiers' })
@Unique({ properties: ['erwinId'] })
export class ErwinIdentifierEntity extends BaseEntityWithTimestamps {
	@Property()
	erwinId: string;

	@Property()
	type: ReferencedEntityType;

	@Property()
	referencedEntityId: EntityId;

	constructor(props: ErwinIdentifierEntityProps) {
		super();

		if (props.id !== undefined) {
			this.id = props.id;
		}

		this.erwinId = props.erwinId;
		this.type = props.type;
		this.referencedEntityId = props.referencedEntityId;
	}
}
