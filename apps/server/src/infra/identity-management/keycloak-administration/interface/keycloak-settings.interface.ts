export const KeycloakSettings = Symbol('KeycloakSettings');

export interface IKeycloakSettings {
	internalBaseUrl: string;
	externalBaseUrl: string;
	realmName: string;
	clientId: string;
	credentials: {
		username: string;
		password: string;
		grantType: 'password';
		clientId: string;
	};
}
