/**
 * This enums contains scopes which will be used to add dependent claims to the id token.
 */
export enum OauthScope {
	EMAIL = 'email',
	PROFILE = 'profile',
	GROUPS = 'groups',
	ALIAS = 'alias',
	// ToDo: add classes and fed_state, if they are migrated to NEST
	// FEDERALSTATE = "fed_state"
	// CLASSES = 'classes',
}
