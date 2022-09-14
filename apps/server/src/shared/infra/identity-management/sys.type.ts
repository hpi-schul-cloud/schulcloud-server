export enum SysType {
	LDAP = 'ldap',
	OIDC = 'oidc', // systems for authentication via keycloaks brokering mechanism
	OAUTH = 'oauth', // systems for direct authentication via OAuth
	KEYCLOAK = 'keycloak',
}
