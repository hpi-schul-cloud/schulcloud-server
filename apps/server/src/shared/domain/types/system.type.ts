export enum SystemTypeEnum {
	LDAP = 'ldap',
	OAUTH = 'oauth', // systems for direct authentication via OAuth
	KEYCLOAK = 'keycloak',
	OIDC = 'oidc',
}

export type SystemType = SystemTypeEnum;
