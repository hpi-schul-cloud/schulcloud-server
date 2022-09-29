export enum SystemTypeEnum {
	LDAP = 'ldap',
	OIDC = 'oidc', // systems for authentication via keycloaks brokering mechanism
	OAUTH = 'oauth', // systems for direct authentication via OAuth
	KEYCLOAK = 'keycloak',
}

export type SystemType = SystemTypeEnum;
