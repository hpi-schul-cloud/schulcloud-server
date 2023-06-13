import { Entity, Property } from '@mikro-orm/core';
import { ICounty } from '../interface/county';
import { BaseEntity } from './base.entity';

export interface IFederalStateProperties {
	name: string;
	abbreviation: string;
	logoUrl: string;
	counties?: ICounty[];
}

@Entity({ tableName: 'federalstates' })
export class FederalState extends BaseEntity implements IFederalStateProperties {
	@Property()
	name: string;

	@Property()
	abbreviation: string;

	@Property()
	logoUrl: string;

	@Property()
	counties: ICounty[];

	constructor(props: IFederalStateProperties) {
		super();
		this.name = props.name;
		this.abbreviation = props.abbreviation;
		this.logoUrl = props.logoUrl;
		this.counties = props.counties ?? [];
	}
}
