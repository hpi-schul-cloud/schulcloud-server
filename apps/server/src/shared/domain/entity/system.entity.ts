/* istanbul ignore file */ // TODO remove when implementation exists
import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';

export interface ISystemProperties {
	type: string;
	url: string;
	alias: string;
	oauthConfig: OauthConfig;
}

export class OauthConfig {
	constructor(system: System) {
		this.clientId = system.oauthConfig.clientId;
		this.clientSecret = system.oauthConfig.clientSecret;
		this.tokenEndpoint = system.oauthConfig.tokenEndpoint;
		this.grantType = system.oauthConfig.grantType;
		this.tokenRedirectUri = system.oauthConfig.tokenRedirectUri;
		this.scope = system.oauthConfig.scope;
		this.responseType = system.oauthConfig.responseType;
		this.authEndpoint = system.oauthConfig.authEndpoint;
	}

	@Property()
	clientId: string;

	@Property()
	clientSecret: string;

	@Property()
	tokenRedirectUri: string;

	@Property()
	grantType: string;

	@Property()
	tokenEndpoint: string;

	@Property()
	authEndpoint: string;

	@Property()
	responseType: string;

	@Property()
	scope: string;
}
@Entity({ tableName: 'systems' })
export class System extends BaseEntityWithTimestamps {
	constructor(props: ISystemProperties) {
		super();
		this.type = props.type;
		this.url = props.url;
		this.alias = props.alias;
		this.oauthConfig = props.oauthConfig;
	}

	@Property({})
	type: string; // see legacy enum for valid values

	@Property()
	url?: string;

	@Property()
	alias?: string;

	@Property()
	oauthConfig!: OauthConfig;
}
