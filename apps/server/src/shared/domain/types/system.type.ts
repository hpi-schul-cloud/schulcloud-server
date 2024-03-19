export enum SystemTypeEnum {
	LDAP = 'ldap',
	OAUTH = 'oauth', // systems for direct authentication via OAuth,
	OIDC = 'oidc', // systems for direct authentication via OpenID Connect,
}

export enum SystemType {
	OAUTH = 'oauth',
	LDAP = 'ldap',
	OIDC = 'oidc',
	TSP_BASE = 'tsp-base',
	TSP_SCHOOL = 'tsp-school',
	// Legacy
	LOCAL = 'local',
	ISERV = 'iserv',
	LERNSAX = 'lernsax',
	ITSLEARNING = 'itslearning',
	MOODLE = 'moodle',
}
