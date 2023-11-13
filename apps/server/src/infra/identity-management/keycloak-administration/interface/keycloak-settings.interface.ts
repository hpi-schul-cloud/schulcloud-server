export const KeycloakSettings = Symbol('KeycloakSettings');

export interface KeycloakSettingsInterface {
	baseUrl: string;
	realmName: string;
	clientId: string;
	credentials: {
		username: string;
		password: string;
		grantType: 'password';
		clientId: string;
	};
}
