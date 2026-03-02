import { Entity, Property, Unique } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { ErwinIdReferencedEntityType } from '../../types';

export interface ErwinIdEntityProps {
	id?: EntityId;
	erwinId: string; // UUID from Erwin Portal
	type: ErwinIdReferencedEntityType; // user or school
	erwinIdReferencedEntityId: EntityId; // user or school id from SVS
}

@Entity({ tableName: 'erwin-ids' })
@Unique({ properties: ['erwinId'] })
export class ErwinIdEntity extends BaseEntityWithTimestamps {
	@Property()
	erwinId: string;

	@Property()
	type: ErwinIdReferencedEntityType;

	@Property()
	erwinIdReferencedEntityId: EntityId;

	constructor(props: ErwinIdEntityProps) {
		super();

		if (props.id !== undefined) {
			this.id = props.id;
		}

		this.erwinId = props.erwinId;
		this.type = props.type;
		this.erwinIdReferencedEntityId = props.erwinIdReferencedEntityId;
	}
}
