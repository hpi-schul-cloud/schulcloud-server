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
	constructor(oauthConfig: OauthConfig) {
		this.clientId = oauthConfig.clientId;
		this.clientSecret = oauthConfig.clientSecret;
		this.tokenEndpoint = oauthConfig.tokenEndpoint;
		this.grantType = oauthConfig.grantType;
		this.tokenRedirectUri = oauthConfig.tokenRedirectUri;
		this.scope = oauthConfig.scope;
		this.responseType = oauthConfig.responseType;
		this.authEndpoint = oauthConfig.authEndpoint;
		this.provider = oauthConfig.provider;
		this.logoutEndpoint = oauthConfig.logoutEndpoint;
		this.issuer = oauthConfig.issuer;
		this.jwksEndpoint = oauthConfig.jwksEndpoint;
		this.codeRedirectUri = oauthConfig.codeRedirectUri;
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

	@Property()
	provider: string;

	@Property()
	logoutEndpoint: string;

	@Property()
	issuer: string;

	@Property()
	jwksEndpoint: string;

	@Property()
	codeRedirectUri: string;
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

	@Property({ nullable: true })
	url?: string;

	@Property({ nullable: true })
	alias?: string;

	@Property({ nullable: true })
	oauthConfig?: OauthConfig;
}
