import { Entity, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';

export interface MediaSourceEntityProps {
	id?: EntityId;

	name?: string;

	sourceId: string;
}

@Entity({ tableName: 'media-sources' })
export class MediaSourceEntity extends BaseEntityWithTimestamps {
	constructor(props: MediaSourceEntityProps) {
		super();
		if (props.id != null) {
			this.id = props.id;
		}
		this.name = props.name;
		this.sourceId = props.sourceId;
	}

	@Property({ nullable: true })
	name?: string;

	@Index()
	@Property()
	sourceId: string;
}
