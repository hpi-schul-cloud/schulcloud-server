import { Entity, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

export interface ReleaseEntityProps {
	id?: string;
	githubId: number;
	name: string;
	body?: string;
	url: string;
	author: string;
	authorUrl: string;
	createdAt?: Date;
	publishedAt: Date;
	zipUrl?: string;
	imageIds?: EntityId[];
}

@Entity({ tableName: 'releases' })
export class ReleaseEntity extends BaseEntity {
	// sparse: documents of the legacy feathers service have no githubId and are removed on the next fetch
	@Property()
	@Unique({ options: { sparse: true } })
	githubId: number;

	@Property()
	name: string;

	@Property({ type: String })
	body = '';

	@Property()
	url: string;

	@Property()
	author: string;

	@Property()
	authorUrl: string;

	@Property({ type: Date })
	createdAt = new Date();

	@Property({ type: Date })
	publishedAt: Date;

	@Property({ type: String, nullable: true })
	zipUrl?: string;

	/** ids of the release images referenced in the body */
	@Property()
	imageIds: EntityId[] = [];

	/** start time of the refresh that wrote this release, so an older (stale) refresh cannot overwrite or delete it */
	@Property({ type: Date, nullable: true })
	syncedAt?: Date;

	constructor(props: ReleaseEntityProps) {
		super();

		if (props.id) {
			this.id = props.id;
		}

		this.githubId = props.githubId;
		this.name = props.name;
		this.body = props.body ?? '';
		this.url = props.url;
		this.author = props.author;
		this.authorUrl = props.authorUrl;
		this.createdAt = props.createdAt ?? new Date();
		this.publishedAt = props.publishedAt;
		this.zipUrl = props.zipUrl;
		this.imageIds = props.imageIds ?? [];
	}
}
