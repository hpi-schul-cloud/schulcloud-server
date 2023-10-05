import { Embeddable, Embedded, Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';

export interface IFederalStateProperties {
	name: string;
	abbreviation: string;
	logoUrl: string;
	counties?: CountyEmbeddable[];
	createdAt: Date;
	updatedAt: Date;
}

@Embeddable()
export class CountyEmbeddable {
	constructor(county: CountyEmbeddable) {
		this.name = county.name;
		this.countyId = county.countyId;
		this.antaresKey = county.antaresKey;
	}

	@Property()
	name: string;

	@Property()
	countyId: number;

	@Property()
	antaresKey: string;
}

@Entity({ tableName: 'federalstates' })
export class FederalStateEntity extends BaseEntityWithTimestamps {
	@Property({ nullable: false })
	name: string;

	@Property({ nullable: false })
	abbreviation: string;

	@Property()
	logoUrl: string;

	@Embedded(() => CountyEmbeddable, { array: true, nullable: true })
	counties?: CountyEmbeddable[];

	constructor(props: IFederalStateProperties) {
		super();
		this.name = props.name;
		this.abbreviation = props.abbreviation;
		this.logoUrl = props.logoUrl;
		this.updatedAt = props.updatedAt;
		this.createdAt = props.createdAt;
	}
}
