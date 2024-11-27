import { Embedded, Entity, Index, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { MediaSourceDataFormat } from '../enum';
import { MediaSourceBasicConfigEmbeddable } from './media-source-basic-config.embeddable';
import { MediaSourceOauthConfigEmbeddable } from './media-source-oauth-config.embeddable';

export interface MediaSourceEntityProps {
	id?: EntityId;

	name?: string;

	sourceId: string;

	oauthConfig?: MediaSourceOauthConfigEmbeddable;

	basicConfig?: MediaSourceBasicConfigEmbeddable;

	format?: MediaSourceDataFormat;
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
		this.oauthConfig = props.oauthConfig;
		this.basicConfig = props.basicConfig;
	}

	@Index()
	@Property()
	sourceId: string;

	@Property({ nullable: true })
	name?: string;

	@Property({ nullable: true })
	format?: MediaSourceDataFormat;

	@Embedded(() => MediaSourceOauthConfigEmbeddable, { object: true, nullable: true })
	oauthConfig?: MediaSourceOauthConfigEmbeddable;

	@Embedded(() => MediaSourceBasicConfigEmbeddable, { object: true, nullable: true })
	basicConfig?: MediaSourceBasicConfigEmbeddable;
}
