import { Embedded, Entity, Property, Unique } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { MediaSourceDataFormat } from '../enum';
import { MediaSourceOauthConfigEmbeddable } from './media-source-oauth-config.embeddable';
import { MediaSourceVidisConfigEmbeddable } from './media-source-vidis-config.embeddable';

export interface MediaSourceEntityProps {
	id?: EntityId;

	name?: string;

	sourceId: string;

	oauthConfig?: MediaSourceOauthConfigEmbeddable;

	vidisConfig?: MediaSourceVidisConfigEmbeddable;

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
		this.vidisConfig = props.vidisConfig;
	}

	@Unique()
	@Property()
	sourceId: string;

	@Property({ nullable: true })
	name?: string;

	@Property({ nullable: true })
	format?: MediaSourceDataFormat;

	@Embedded(() => MediaSourceOauthConfigEmbeddable, { object: true, nullable: true })
	oauthConfig?: MediaSourceOauthConfigEmbeddable;

	@Embedded(() => MediaSourceVidisConfigEmbeddable, { object: true, nullable: true })
	vidisConfig?: MediaSourceVidisConfigEmbeddable;
}
