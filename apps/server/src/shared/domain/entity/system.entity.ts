/* istanbul ignore file */ // TODO remove when implementation exists
import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';

export interface ISystemProperties {
	type: string;
	url?: string;
	alias?: string;
}

@Entity({ tableName: 'systems' })
export class System extends BaseEntityWithTimestamps {
	constructor(props: ISystemProperties) {
		super();
		this.type = props.type;
		if (props.url != null) this.url = props.url;
		if (props.alias != null) this.alias = props.alias;
	}

	@Property({})
	type: string; // see legacy enum for valid values

	@Property()
	url?: string;

	@Property()
	alias?: string;
}
