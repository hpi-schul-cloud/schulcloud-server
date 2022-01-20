/* istanbul ignore file */ // TODO remove when implementation exists
import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';

export interface ISystemProperties {
	type: string;
	url?: string;
	alias?: string;
	clientId?: string;
	clientSecret?: string;
	redirect_uri?: string;
	grant_type?: string;
}

@Entity({ tableName: 'systems' })
export class System extends BaseEntityWithTimestamps {
	constructor(props: System) {
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

	@Property()
	clientId?: string;

	@Property()
	clientSecret?: string;

	@Property()
	redirect_uri?: string;

	@Property()
	grant_type?: string;
}
