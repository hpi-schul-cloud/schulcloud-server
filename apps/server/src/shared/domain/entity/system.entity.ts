import { Entity, Enum, Property } from '@mikro-orm/core';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { BaseEntityWithTimestamps } from './base.entity';

export interface ISystemProperties {
	type: string;
	url?: string;
	alias?: string;
	displayName?: string;
	oauthConfig?: OauthConfig;
	provisioningStrategy?: SystemProvisioningStrategy;
}

export class OauthConfig {
	constructor(oauthConfig: OauthConfig) {
		this.clientId = oauthConfig.clientId;
		this.clientSecret = oauthConfig.clientSecret;
		this.tokenEndpoint = oauthConfig.tokenEndpoint;
		this.grantType = oauthConfig.grantType;
		this.redirectUri = oauthConfig.redirectUri;
		this.scope = oauthConfig.scope;
		this.responseType = oauthConfig.responseType;
		this.authEndpoint = oauthConfig.authEndpoint;
		this.provider = oauthConfig.provider;
		this.logoutEndpoint = oauthConfig.logoutEndpoint;
		this.issuer = oauthConfig.issuer;
		this.jwksEndpoint = oauthConfig.jwksEndpoint;
	}

	@Property()
	clientId: string;

	@Property()
	clientSecret: string;

	@Property()
	redirectUri: string;

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
}
@Entity({ tableName: 'systems' })
export class System extends BaseEntityWithTimestamps {
	constructor(props: ISystemProperties) {
		super();
		this.type = props.type;
		this.url = props.url;
		this.alias = props.alias;
		this.displayName = props.displayName;
		this.oauthConfig = props.oauthConfig;
		this.provisioningStrategy = props.provisioningStrategy;
	}

	@Property({ nullable: false })
	type: string; // see legacy enum for valid values

	@Property({ nullable: true })
	url?: string;

	@Property({ nullable: true })
	alias?: string;

	@Property({ nullable: true })
	displayName?: string;

	@Property({ nullable: true })
	oauthConfig?: OauthConfig;

	@Property({ nullable: true })
	@Enum()
	provisioningStrategy?: SystemProvisioningStrategy;

	@Property({ nullable: true })
	config?: Record<string, unknown>;

	@Property({ nullable: true })
	ldapConfig?: Record<string, unknown>;
}
