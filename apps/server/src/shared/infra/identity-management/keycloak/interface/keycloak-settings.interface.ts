export const KeycloakSettings = Symbol('KeycloakSettings');

export interface IKeycloakSettings {
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
