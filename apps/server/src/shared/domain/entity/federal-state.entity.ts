import { Embeddable, Embedded, Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';

export interface IFederalStateProperties {
	name: string;
	abbreviation: string;
	logoUrl: string;
	counties?: County[];
}

@Embeddable()
export class County {
	constructor(county: County) {
		this.name = county.name;
		this.countyId = county.countyId;
		this.antaresKey = county.antaresKey;
	}

	name: string;

	countyId: string;

	antaresKey: string;
}

@Entity({ tableName: 'federalstates' })
export class FederalState extends BaseEntityWithTimestamps {
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
	}
}
