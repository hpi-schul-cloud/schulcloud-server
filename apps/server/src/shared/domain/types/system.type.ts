export enum SystemTypeEnum {
	LDAP = 'ldap',
	OAUTH = 'oauth', // systems for direct authentication via OAuth
	KEYCLOAK = 'keycloak',
}

export type SystemType = SystemTypeEnum;
