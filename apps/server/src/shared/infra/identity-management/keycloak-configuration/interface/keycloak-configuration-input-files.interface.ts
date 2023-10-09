export const KeycloakConfigurationInputFiles = Symbol('KeycloakConfigurationInputFiles');

// Is configuration for this module the correct name?
// It look more like it it is for seeding with some lokal configuration over console.
// Can you please look into the namings, if they are correct than it is fine, if not please rename this folder and files.
export interface IKeycloakConfigurationInputFiles {
	accountsFile: string;
	usersFile: string;
}
