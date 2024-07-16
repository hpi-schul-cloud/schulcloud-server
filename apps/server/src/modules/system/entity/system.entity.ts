import { Cascade, Collection, Embeddable, Embedded, Entity, Enum, OneToMany, Property } from '@mikro-orm/core';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { EntityId } from '@shared/domain/types';

export interface SystemEntityProps {
	type: string;
	url?: string;
	alias?: string;
	displayName?: string;
	oauthConfig?: OauthConfigEntity;
	oidcConfig?: OidcConfigEntity;
	ldapConfig?: LdapConfigEntity;
	provisioningStrategy?: SystemProvisioningStrategy;
	provisioningUrl?: string;
}

export class OauthConfigEntity {
	constructor(oauthConfig: OauthConfigEntity) {
		this.clientId = oauthConfig.clientId;
		this.clientSecret = oauthConfig.clientSecret;
		this.idpHint = oauthConfig.idpHint;
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

	@Property({ nullable: true })
	idpHint?: string;

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

	@Property({ nullable: true })
	logoutEndpoint?: string;

	@Property()
	issuer: string;

	@Property()
	jwksEndpoint: string;
}

@Embeddable()
export class LdapConfigEntity {
	constructor(ldapConfig: Readonly<LdapConfigEntity>) {
		this.active = ldapConfig.active;
		this.federalState = ldapConfig.federalState;
		this.lastSyncAttempt = ldapConfig.lastSyncAttempt;
		this.lastSuccessfulFullSync = ldapConfig.lastSuccessfulFullSync;
		this.lastSuccessfulPartialSync = ldapConfig.lastSuccessfulPartialSync;
		this.lastModifyTimestamp = ldapConfig.lastModifyTimestamp;
		this.url = ldapConfig.url;
		this.rootPath = ldapConfig.rootPath;
		this.searchUser = ldapConfig.searchUser;
		this.searchUserPassword = ldapConfig.searchUserPassword;
		this.provider = ldapConfig.provider;
		this.providerOptions = ldapConfig.providerOptions;
	}

	@Property({ nullable: true })
	active?: boolean;

	@Property({ nullable: true })
	federalState?: EntityId;

	@Property({ nullable: true })
	lastSyncAttempt?: Date;

	@Property({ nullable: true })
	lastSuccessfulFullSync?: Date;

	@Property({ nullable: true })
	lastSuccessfulPartialSync?: Date;

	@Property({ nullable: true })
	lastModifyTimestamp?: string;

	@Property()
	url: string;

	@Property({ nullable: true })
	rootPath?: string;

	@Property({ nullable: true })
	searchUser?: string;

	@Property({ nullable: true })
	searchUserPassword?: string;

	@Property({ nullable: true })
	provider?: string;

	@Property({ nullable: true })
	providerOptions?: {
		schoolName?: string;
		userPathAdditions?: string;
		classPathAdditions?: string;
		roleType?: string;
		userAttributeNameMapping?: {
			givenName?: string;
			sn?: string;
			dn?: string;
			uuid?: string;
			uid?: string;
			mail?: string;
			role?: string;
		};
		roleAttributeNameMapping?: {
			roleStudent?: string;
			roleTeacher?: string;
			roleAdmin?: string;
			roleNoSc?: string;
		};
		classAttributeNameMapping?: {
			description?: string;
			dn?: string;
			uniqueMember?: string;
		};
	};
}
export class OidcConfigEntity {
	constructor(oidcConfig: OidcConfigEntity) {
		this.clientId = oidcConfig.clientId;
		this.clientSecret = oidcConfig.clientSecret;
		this.idpHint = oidcConfig.idpHint;
		this.authorizationUrl = oidcConfig.authorizationUrl;
		this.tokenUrl = oidcConfig.tokenUrl;
		this.logoutUrl = oidcConfig.logoutUrl;
		this.userinfoUrl = oidcConfig.userinfoUrl;
		this.defaultScopes = oidcConfig.defaultScopes;
	}

	@Property()
	clientId: string;

	@Property()
	clientSecret: string;

	@Property()
	idpHint: string;

	@Property()
	authorizationUrl: string;

	@Property()
	tokenUrl: string;

	@Property()
	logoutUrl: string;

	@Property()
	userinfoUrl: string;

	@Property()
	defaultScopes: string;
}

@Entity({ tableName: 'systems' })
export class SystemEntity extends BaseEntityWithTimestamps {
	@Property({ nullable: false })
	type: string; // see legacy enum for valid values

	@Property({ nullable: true })
	url?: string;

	@Property({ nullable: true })
	alias?: string;

	@Property({ nullable: true })
	displayName?: string;

	@Property({ nullable: true })
	oauthConfig?: OauthConfigEntity;

	@Property({ nullable: true })
	@Enum()
	provisioningStrategy?: SystemProvisioningStrategy;

	@Property({ nullable: true })
	oidcConfig?: OidcConfigEntity;

	@Embedded({ entity: () => LdapConfigEntity, object: true, nullable: true })
	ldapConfig?: LdapConfigEntity;

	@Property({ nullable: true })
	provisioningUrl?: string;

	@OneToMany(() => SchoolSystemOptionsEntity, (options) => options.system, { cascade: [Cascade.REMOVE] })
	schoolSystemOptions = new Collection<SchoolSystemOptionsEntity>(this);

	constructor(props: SystemEntityProps) {
		super();
		this.type = props.type;
		this.url = props.url;
		this.alias = props.alias;
		this.displayName = props.displayName;
		this.oauthConfig = props.oauthConfig;
		this.oidcConfig = props.oidcConfig;
		this.ldapConfig = props.ldapConfig;
		this.provisioningStrategy = props.provisioningStrategy;
		this.provisioningUrl = props.provisioningUrl;
	}
}
