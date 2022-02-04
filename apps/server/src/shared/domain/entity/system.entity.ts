/* istanbul ignore file */ // TODO remove when implementation exists
import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';

export interface ISystemProperties {
	type: string;
	url: string;
	alias: string;
	oauthconfig: OauthConfig;
}

export class OauthConfig {
	constructor(system: System) {
		this.client_id = system.oauthconfig.client_id;
		this.client_secret = system.oauthconfig.client_secret;
		this.token_endpoint = system.oauthconfig.token_endpoint;
		this.grant_type = system.oauthconfig.grant_type;
		this.token_redirect_uri = system.oauthconfig.token_redirect_uri;
		this.scope = system.oauthconfig.scope;
		this.response_type = system.oauthconfig.response_type;
		this.auth_endpoint = system.oauthconfig.auth_endpoint;
		this.auth_redirect_uri = system.oauthconfig.auth_redirect_uri;
	}

	@Property()
	client_id: string;

	@Property()
	client_secret: string;

	@Property()
	auth_redirect_uri: string;

	@Property()
	token_redirect_uri: string;

	@Property()
	grant_type: string;

	@Property()
	token_endpoint: string;

	@Property()
	auth_endpoint: string;

	@Property()
	response_type: string;

	@Property()
	scope: string;
}
@Entity({ tableName: 'systems' })
export class System extends BaseEntityWithTimestamps {
	@Property({})
	type: string; // see legacy enum for valid values

	@Property()
	url?: string;

	@Property()
	alias?: string;

	@Property()
	oauthconfig!: OauthConfig;

	constructor(props: ISystemProperties) {
		super();
		this.type = props.type;
		this.url = props.url;
		this.alias = props.alias;
		this.oauthconfig = props.oauthconfig;
	}
}
