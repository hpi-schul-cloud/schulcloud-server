import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '@shared/domain/entity';

export interface ReleaseEntityProps {
	id?: string;
	name: string;
	body?: string;
	url: string;
	author: string;
	authorUrl: string;
	createdAt?: Date;
	publishedAt: Date;
	zipUrl?: string;
}

@Entity({ tableName: 'releases' })
export class ReleaseEntity extends BaseEntity {
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

	constructor(props: ReleaseEntityProps) {
		super();

		if (props.id) {
			this.id = props.id;
		}

		this.name = props.name;
		this.body = props.body ?? '';
		this.url = props.url;
		this.author = props.author;
		this.authorUrl = props.authorUrl;
		this.createdAt = props.createdAt ?? new Date();
		this.publishedAt = props.publishedAt;
		this.zipUrl = props.zipUrl;
	}
}
