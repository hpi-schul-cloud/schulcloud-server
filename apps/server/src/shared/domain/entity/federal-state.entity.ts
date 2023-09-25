import { Embeddable, Embedded, Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';

export interface IFederalStateProperties {
	name: string;
	abbreviation: string;
	logoUrl: string;
	counties?: County[];
	createdAt: Date;
	updatedAt: Date;
}

// TODO: Do we also want to rename embedded types, e.g. to "CountyEmbeddable", to avoid naming conflicts with the domain types.
@Embeddable()
export class County {
	constructor(county: County) {
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

	@Embedded(() => County, { array: true, nullable: true })
	counties?: County[];

	constructor(props: IFederalStateProperties) {
		super();
		this.name = props.name;
		this.abbreviation = props.abbreviation;
		this.logoUrl = props.logoUrl;
		this.updatedAt = props.updatedAt;
		this.createdAt = props.createdAt;
	}
}
