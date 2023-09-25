// TODO: I think this should be renamed to SchoolFeature because an enum's name should always be singular.
// Though probably too much for this PR.
export enum SchoolFeatures {
	ROCKET_CHAT = 'rocketChat',
	VIDEOCONFERENCE = 'videoconference',
	NEXTCLOUD = 'nextcloud',
	STUDENTVISIBILITY = 'studentVisibility', // deprecated
	LDAP_UNIVENTION_MIGRATION = 'ldapUniventionMigrationSchool',
	OAUTH_PROVISIONING_ENABLED = 'oauthProvisioningEnabled',
	SHOW_OUTDATED_USERS = 'showOutdatedUsers',
	ENABLE_LDAP_SYNC_DURING_MIGRATION = 'enableLdapSyncDuringMigration',
}
