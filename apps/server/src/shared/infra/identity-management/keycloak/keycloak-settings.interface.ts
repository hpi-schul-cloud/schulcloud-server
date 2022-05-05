export const KeycloakSettings = Symbol('KeycloakSettings');

export interface IKeycloakSettings {
	baseUrl: string;
	realmName: string;
	credentials: {
		username: string;
		password: string;
		grantType: 'password';
		clientId: string;
	};
}
