import { Embedded, Entity, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { MediaSourceDataFormat } from '../enum/media-source-data-format.enum';
import { MediaSourceConfigEmbeddable } from './media-source-oauth-config.embeddable';

export interface MediaSourceEntityProps {
	id?: EntityId;

	name?: string;

	sourceId: string;

	config: MediaSourceConfigEmbeddable;

	format: MediaSourceDataFormat;
}

@Entity({ tableName: 'media-sources' })
export class MediaSourceEntity extends BaseEntityWithTimestamps {
	constructor(props: MediaSourceEntityProps) {
		super();
		if (props.id) {
			this.id = props.id;
		}
		this.sourceId = props.sourceId;
		this.name = props.name;
		this.format = props.format;
		this.config = props.config;
	}

	@Index()
	@Property()
	sourceId: string;

	@Property({ nullable: true })
	name?: string;

	@Property()
	format: MediaSourceDataFormat;

	@Embedded(() => MediaSourceConfigEmbeddable, { object: true })
	config: MediaSourceConfigEmbeddable;
}
