import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { ErwinIdReferencedEntityType } from '../../types';

export interface ErwinIdEntityProps {
	id?: EntityId;
	type: ErwinIdReferencedEntityType;
	erwinId: string;
	systemId: string;
	externalId: string;
}

@Entity({ tableName: 'erwin-ids' })
@Unique({ properties: ['erwinId'] })
export class ErwinIdEntity extends BaseEntityWithTimestamps {
	@Property()
	type: ErwinIdReferencedEntityType;

	@Property()
	@Index()
	erwinId: string;

	@Property()
	systemId: string;

	@Property()
	externalId: string;

	constructor(props: ErwinIdEntityProps) {
		super();

		if (props.id !== undefined) {
			this.id = props.id;
		}

		this.type = props.type;
		this.erwinId = props.erwinId;
		this.systemId = props.systemId;
		this.externalId = props.externalId;
	}
}
