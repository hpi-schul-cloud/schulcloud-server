import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';

export interface TargetGroupProperties {
	state?: string;
	schoolType?: string;
	grade?: string;
}

export interface RelatedResourceProperties {
	originId?: string;
	relationType?: string;
}

export interface MaterialProperties {
	client: string;
	description?: string;
	license: string[];
	merlinReference?: string;
	relatedResources: RelatedResourceProperties[];
	subjects: string[];
	tags: string[];
	targetGroups: TargetGroupProperties[];
	title: string;
	url: string;
}

@Entity({ collection: 'materials' })
export class Material extends BaseEntityWithTimestamps {
	@Property()
	client: string;

	@Property()
	description?: string;

	@Property()
	license: string[];

	@Property()
	merlinReference?: string;

	@Property()
	relatedResources: RelatedResourceProperties[] | [];

	@Property()
	subjects: string[] | [];

	@Property()
	tags: string[] | [];

	@Property()
	targetGroups: TargetGroupProperties[] | [];

	@Property()
	title: string;

	@Property()
	url: string;

	constructor(props: MaterialProperties) {
		super();
		this.client = props.client;
		this.description = props.description || '';
		this.license = props.license;
		this.merlinReference = props.merlinReference || '';
		this.relatedResources = props.relatedResources;
		this.subjects = props.subjects;
		this.tags = props.tags;
		this.targetGroups = props.targetGroups;
		this.title = props.title;
		this.url = props.url;
	}
}
