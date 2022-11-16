/**
 * This enums contains scopes which will be used to add dependent claims to the id token.
 */
export enum OauthScope {
	EMAIL = 'email',
	PROFILE = 'profile',
	GROUPS = 'groups',
	USERROLE = 'user_role',
	// ToDo: add fedState, if the federalState is migrated to NEST
	// FEDERALSTATE = "federal_state"
}
